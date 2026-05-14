import { COOKIE_NAME } from "@shared/const";
import { postToFacebook, postToInstagram, getFacebookPostStats, isFacebookConfigured, isInstagramConfigured } from "./socialMedia";
import { getCalendarTasksForMonth, getCalendarTasksForUser, createCalendarTask, updateCalendarTask, deleteCalendarTask, createTimeOffRequest, getTimeOffRequestsForUser, getAllTimeOffRequests, updateTimeOffRequest, getApprovedTimeOffForMonth } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { 
  getNotificationPreferences, 
  upsertNotificationPreferences,
  getNotificationHistory,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadNotificationCount,
  createNotificationHistory,
  getAllTestimonials,
  getFeaturedTestimonials,
  createTestimonial,
  createTrialSignup,
  getAllTrialSignups,
  updateTrialSignupStatus,
  getAvailableClassSchedules,
  createWaiverSignature
} from "./db";
import { submitLeadToDojoFlow } from "./dojoFlowClient";
import { getAvailableClassTimes } from "./services/dojoFlowSchedule";
import { getNextClassTimes, formatClassTime } from "./scheduleHelpers";
import { textToSpeech } from "./textToSpeech";
import { transcribeAudio } from "./_core/voiceTranscription";
import { chatWithChatGPT, type ChatbotState } from "./chatgpt-chatbot";
import type { Message } from "./_core/llm";
import { storagePut } from "./storage";
import { 
  initializeIntakeState, 
  processIntakeMessage, 
  getInitialGreeting,
  type IntakeState 
} from "./intakeStateMachine";
import {
  processTFMessage,
  getTFGreeting,
  createTFState,
  generateQuestion,
  type TFState,
  TFStep,
} from "./intakeStateMachine.trialFirst";
import { getWeatherGreetingHook } from "./weatherService";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { authRouter } from "./authRouter";
import Stripe from "stripe";
import QRCode from "qrcode";
import { getDb } from "./db";
import * as schema from "../drizzle/schema";
import { chatbotConversations, trialSignups, conversationStates } from "../drizzle/schema";
import { eq, and, or, desc, asc, isNull, isNotNull, ne, sql, inArray, like, not, between } from "drizzle-orm";
import { getMemberEnrollment, getMemberClassSchedules, getMemberPaymentHistory, getMemberSubscription } from "./memberDashboard";
import { createChangeRequest, getUserChangeRequests, getPendingChangeRequests, approveChangeRequest, denyChangeRequest } from "./membershipChangeRequests";
import { sendStreakMilestoneEmail, checkStreakMilestone, sendEnrollmentConfirmationEmail } from "./emailService";
import { ENV } from "./_core/env";
import { getWeatherForSlot } from "./weather";
import { mealPlanRouter } from "./mealPlanRouter";
import { heroContentRouter } from "./heroContentRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  mealPlan: mealPlanRouter,
  heroContent: heroContentRouter,
  auth: router({
    ...authRouter._def.procedures,
    me: publicProcedure.query(opts => opts.ctx.user),
  }),

  notifications: router({
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const preferences = await getNotificationPreferences(ctx.user.id);
      
      // Return default preferences if none exist
      if (!preferences) {
        return {
          classUpdates: 1,
          scheduleChanges: 1,
          specialEvents: 1,
          promotions: 1,
          generalNews: 1,
        };
      }
      
      return {
        classUpdates: preferences.classUpdates,
        scheduleChanges: preferences.scheduleChanges,
        specialEvents: preferences.specialEvents,
        promotions: preferences.promotions,
        generalNews: preferences.generalNews,
      };
    }),
    
    updatePreferences: protectedProcedure
      .input(
        z.object({
          classUpdates: z.number().min(0).max(1).optional(),
          scheduleChanges: z.number().min(0).max(1).optional(),
          specialEvents: z.number().min(0).max(1).optional(),
          promotions: z.number().min(0).max(1).optional(),
          generalNews: z.number().min(0).max(1).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertNotificationPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  notificationHistory: router({
    list: protectedProcedure
      .input(
        z.object({
          type: z.enum(["classUpdates", "scheduleChanges", "specialEvents", "promotions", "generalNews"]).optional(),
          isRead: z.number().min(0).max(1).optional(),
          limit: z.number().min(1).max(100).optional(),
          offset: z.number().min(0).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const notifications = await getNotificationHistory(ctx.user.id, input);
        return notifications;
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadNotificationCount(ctx.user.id);
      return { count };
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationAsRead(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteNotification(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    // Admin/system endpoint to create notifications (for testing or admin dashboard)
    create: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          title: z.string(),
          message: z.string(),
          type: z.enum(["classUpdates", "scheduleChanges", "specialEvents", "promotions", "generalNews"]),
        })
      )
      .mutation(async ({ input }) => {
        await createNotificationHistory(input);
        return { success: true };
      }),
  }),

  trialSignups: router({
    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email().or(z.literal("")).optional(),
          phone: z.string().min(10),
          program: z.enum(["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp", "Not Sure"]),
                segment: z.enum(["Kids 3-5", "Kids 6-12", "Teens", "Adult Karate", "Kickboxing", "Not sure"]).optional(),
          goal: z.enum(["Confidence", "Discipline", "Fitness", "Self-defense", "Bullying help", "Weight loss"]).optional(),
          preferredDays: z.enum(["Weekdays", "Weekends", "Either"]).optional(),
          scheduledTime: z.date().optional(),
          location: z.string().min(1),
          preferredContactMethod: z.enum(["email", "phone", "text"]).optional(),
          message: z.string().optional(),
          source: z.enum(["chatbot", "landing_page", "trial_form", "website"]).optional(),
          introCountRequired: z.number().min(0).max(2).optional(),
          introCountBooked: z.number().min(0).max(2).optional(),
          introCountCompleted: z.number().min(0).max(2).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const source = input.source || "chatbot";
        let syncStatus: "pending" | "synced" | "failed" = "pending";
        let syncError: string | undefined = undefined;

        // Attempt to sync to DojoFlow immediately
        try {
          await submitLeadToDojoFlow({
            name: input.name,
            email: input.email || "",
            phone: input.phone,
            program: input.program,
            location: input.location,
            preferredContactMethod: input.preferredContactMethod || "phone",
            message: input.message,
            source: source as "chatbot" | "landing_page" | "trial_form" | "website",
          });
          syncStatus = "synced";
          console.log("[Trial Signup] Successfully synced to DojoFlow");
        } catch (error) {
          syncStatus = "failed";
          syncError = error instanceof Error ? error.message : String(error);
          console.error("[Trial Signup] Failed to sync to DojoFlow:", syncError);
          // Continue - background job will retry
        }

        // Save to local database with sync status
        const lead = await createTrialSignup({
          ...input,
          preferredContactMethod: input.preferredContactMethod || "email",
          status: "new",
          source,
          dojoFlowSyncStatus: syncStatus,
          dojoFlowSyncAttempts: syncStatus === "synced" ? 1 : 0,
          dojoFlowLastSyncAttempt: new Date(),
          dojoFlowSyncError: syncError,
        });

        if (!lead) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create lead" });
        }

        // Notify staff via SMS (fire-and-forget)
        const { notifyStaffNewLead } = await import('./notifyStaffNewLead');
        notifyStaffNewLead({ name: input.name, phone: input.phone, program: input.program, source }).catch(() => {});

        return { success: true, id: lead.id };
      }),

    getAll: protectedProcedure
      .query(async () => {
        const signups = await getAllTrialSignups();
        return signups;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          email: z.string().email().or(z.literal("")).optional(),
          program: z.enum(["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Not Sure"]).optional(),
          preferredDays: z.enum(["Weekdays", "Weekends", "Either"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        
        // Get current lead data
        const db = await getDb();
        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        }
        const [lead] = await db.select().from(trialSignups).where(eq(trialSignups.id, id)).limit(1);
        
        if (!lead) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
        }
        
        // Update lead in database
        await db.update(trialSignups).set(updates).where(eq(trialSignups.id, id));
        
        // If email or program changed, try to sync to DojoFlow
        if (updates.email || updates.program) {
          try {
            await submitLeadToDojoFlow({
              name: lead.name,
              email: updates.email || lead.email || "",
              phone: lead.phone,
              program: (updates.program || lead.program) as any,
              location: lead.location,
              preferredContactMethod: lead.preferredContactMethod,
              message: lead.message || undefined,
              source: lead.source as any,
            });
            
            // Update sync status
            await db.update(trialSignups).set({
              dojoFlowSyncStatus: "synced",
              dojoFlowSyncAttempts: (lead.dojoFlowSyncAttempts || 0) + 1,
              dojoFlowLastSyncAttempt: new Date(),
            }).where(eq(trialSignups.id, id));
          } catch (error) {
            console.error("[Trial Signup Update] Failed to sync to DojoFlow:", error);
            // Background job will retry
          }
        }
        
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateTrialSignupStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  schedule: router({
    getAvailableTimes: publicProcedure
      .input(
        z.object({
          program: z.string().optional(),
          locationId: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const classes = await getAvailableClassTimes(input);
        return classes;
      }),

    getNextClasses: publicProcedure
      .input(
        z.object({
          program: z.string(),
          location: z.string().optional(),
          limit: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const classes = await getNextClassTimes(
          input.program,
          input.location || "Tomball HQ",
          input.limit || 2 // Default to 2 options as per voice flow requirements
        );
        
        // Format classes for display
        const formattedClasses = classes.map(c => ({
          id: c.id,
          dayOfWeek: c.dayOfWeek,
          startTime: c.startTime,
          endTime: c.endTime,
          formatted: formatClassTime(c),
        }));
        
        return formattedClasses;
      }),

    getClassSchedules: publicProcedure
      .input(
        z.object({
          programs: z.array(z.string()),
          location: z.string(),
        })
      )
      .query(async ({ input }) => {
        const schedules = await getAvailableClassSchedules(input.programs, input.location);
        return schedules;
      }),
  }),

  ai: router({    
    textToSpeech: publicProcedure
      .input(
        z.object({
          text: z.string().min(1).max(5000),
          voiceId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const audioBuffer = await textToSpeech(input.text, input.voiceId);
        // Convert buffer to base64 for transmission
        const base64Audio = audioBuffer.toString('base64');
        return { audio: base64Audio, format: 'mp3' };
      }),

    transcribeAudio: publicProcedure
      .input(
        z.object({
          audioBlob: z.string(), // base64 encoded audio
          mimeType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          console.log('[Transcription] Starting transcription process...');
          console.log('[Transcription] Audio blob size:', input.audioBlob.length, 'chars (base64)');
          console.log('[Transcription] MIME type:', input.mimeType);
          
          // Convert base64 to buffer
          const audioBuffer = Buffer.from(input.audioBlob, 'base64');
          console.log('[Transcription] Audio buffer size:', audioBuffer.length, 'bytes');
          
          // Validate audio buffer size
          if (audioBuffer.length === 0) {
            throw new Error('Audio buffer is empty');
          }
          if (audioBuffer.length < 100) {
            throw new Error('Audio buffer too small (likely invalid recording)');
          }
          
          // Upload to S3 to get a URL
          const randomSuffix = Math.random().toString(36).substring(7);
          
          // Determine file extension from MIME type
          let fileExt = 'webm'; // default
          if (input.mimeType.includes('webm')) fileExt = 'webm';
          else if (input.mimeType.includes('ogg')) fileExt = 'ogg';
          else if (input.mimeType.includes('mp4')) fileExt = 'm4a';
          else if (input.mimeType.includes('mpeg') || input.mimeType.includes('mp3')) fileExt = 'mp3';
          else if (input.mimeType.includes('wav')) fileExt = 'wav';
          
          console.log('[Transcription] Detected file extension:', fileExt);
          console.log('[Transcription] Uploading to S3...');
          
          const { url: audioUrl } = await storagePut(
            `voice-chat/audio-${Date.now()}-${randomSuffix}.${fileExt}`,
            audioBuffer,
            input.mimeType
          );
          console.log('[Transcription] Uploaded to:', audioUrl);

          // Transcribe the audio
          console.log('[Transcription] Calling Whisper API...');
          const result = await transcribeAudio({
            audioUrl,
            language: 'en',
            prompt: 'Transcribe the user\'s question about martial arts classes'
          });

          if ('error' in result) {
            console.error('[Transcription] Whisper API error:', result);
            throw new Error(`Transcription failed: ${result.error} (${result.code}${result.details ? ': ' + result.details : ''})`);
          }
          
          // Validate transcription result
          if (!result.text || result.text.trim().length === 0) {
            throw new Error('Transcription returned empty text (no speech detected)');
          }

          console.log('[Transcription] Success! Text:', result.text);
          return {
            text: result.text,
            language: result.language,
            duration: result.duration
          };
        } catch (error) {
          console.error('[Transcription] Fatal error:', error);
          throw error;
        }
      }),
  }),

  chatgpt: router({
    chat: publicProcedure
      .input(
        z.object({
          message: z.string(),
          conversationHistory: z.array(z.object({
            role: z.enum(["system", "user", "assistant", "tool", "function"]),
            content: z.union([z.string(), z.array(z.any())]),
          })),
          currentState: z.object({
            name: z.string().optional(),
            email: z.string().optional(),
            phone: z.string().optional(),
            age: z.number().optional(),
            program: z.string().optional(),
            scheduledTime: z.string().optional(),
            conversationStage: z.enum(["greeting", "collecting_info", "scheduling", "complete"]),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { message, conversationHistory, currentState } = input;
        
        // Call ChatGPT with conversation history and current state
        const response = await chatWithChatGPT(
          message,
          conversationHistory as Message[],
          currentState as ChatbotState
        );
        
        return response;
      }),
  }),

  conversations: router({
    save: publicProcedure
      .input(
        z.object({
          identifier: z.string(), // email or session ID
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          program: z.string().optional(),
          currentStep: z.string(),
          conversationHistory: z.string().optional(), // JSON string
          completed: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { identifier, ...data } = input;
        const db = await getDb();
        if (!db) throw new Error('Database not available');
        
        // Upsert conversation (update if exists, insert if not)
        await db
          .insert(chatbotConversations)
          .values({
            identifier,
            ...data,
            updatedAt: new Date(),
          })
          .onDuplicateKeyUpdate({
            set: {
              ...data,
              updatedAt: new Date(),
            },
          });
        
        return { success: true };
      }),

    load: publicProcedure
      .input(z.object({ identifier: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        
        const conversation = await db
          .select()
          .from(chatbotConversations)
          .where(eq(chatbotConversations.identifier, input.identifier))
          .limit(1);
        
        return conversation[0] || null;
      }),
  }),

  testimonials: router({
    getAll: publicProcedure
      .input(
        z.object({
          program: z.string().optional(),
          minRating: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const testimonials = await getAllTestimonials(input);
        return testimonials;
      }),

    getFeatured: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        const testimonials = await getFeaturedTestimonials(input?.limit);
        return testimonials;
      }),

    create: publicProcedure
      .input(
        z.object({
          memberName: z.string(),
          memberPhoto: z.string().optional(),
          program: z.enum(["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School"]),
          rating: z.number().min(1).max(5),
          title: z.string(),
          content: z.string(),
          memberSince: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createTestimonial({
          ...input,
          featured: 0,
          isApproved: 0, // Require admin approval
        });
        return { success: true };
      }),
  }),

  chat: router({
    /**
     * Mark a message as delivered when it's rendered in the UI
     */
    markDelivered: publicProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { chatMessages } = await import("../drizzle/schema");
        
        await db
          .update(chatMessages)
          .set({ 
            status: "delivered",
            deliveredAt: new Date()
          })
          .where(eq(chatMessages.id, input.messageId));
        
        return { success: true };
      }),

    /**
     * Mark messages as read when they're visible in a focused conversation
     */
    markRead: publicProcedure
      .input(z.object({ 
        conversationId: z.string(),
        upToMessageId: z.number().optional(),
        upToTimestamp: z.date().optional()
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { chatMessages } = await import("../drizzle/schema");
        const { and, lte } = await import("drizzle-orm");
        
        // Build conditions
        const conditions = [eq(chatMessages.conversationId, input.conversationId)];
        
        if (input.upToMessageId) {
          conditions.push(lte(chatMessages.id, input.upToMessageId));
        }
        
        if (input.upToTimestamp) {
          conditions.push(lte(chatMessages.createdAt, input.upToTimestamp));
        }
        
        await db
          .update(chatMessages)
          .set({ 
            status: "read",
            readAt: new Date()
          })
          .where(and(...conditions));
        
        return { success: true };
      }),

    /**
     * Save a new message (from assistant or user)
     */
    saveMessage: publicProcedure
      .input(z.object({
        conversationId: z.string(),
        clientMessageId: z.string().optional(),
        direction: z.enum(["inbound", "outbound"]),
        channel: z.enum(["web", "sms", "voice"]).default("web"),
        content: z.string(),
        metadata: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { chatMessages } = await import("../drizzle/schema");
        
        const [message] = await db.insert(chatMessages).values({
          ...input,
          status: input.direction === "outbound" ? "sent" : "delivered",
          sentAt: input.direction === "outbound" ? new Date() : null,
          deliveredAt: input.direction === "inbound" ? new Date() : null,
        });
        
        return { success: true, messageId: message.insertId };
      }),

    /**
     * Get messages for a conversation
     */
    getMessages: publicProcedure
      .input(z.object({ 
        conversationId: z.string(),
        limit: z.number().optional().default(50)
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const { chatMessages } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");
        
        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, input.conversationId))
          .orderBy(desc(chatMessages.createdAt))
          .limit(input.limit);
        
        return messages.reverse(); // Return in chronological order
      }),

    /**
     * POC: Deterministic intake flow (name → phone → email → confirmation)
     * Prevents repeated questions and stuck loops
     */
    intakeStep: publicProcedure
      .input(z.object({
        message: z.string(),
        sessionId: z.string(),
        bookingRequestId: z.string().optional(), // For idempotent booking
        origin: z.string().optional(), // For Stripe checkout redirect URLs
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

        // RELIABILITY KERNEL: Comprehensive logging on every message
        console.log("[Intake Step] === NEW MESSAGE ===");
        console.log("[Intake Step] conversationId:", input.sessionId);
        console.log("[Intake Step] inputText:", input.message);
        console.log("[Intake Step] bookingRequestId:", input.bookingRequestId || "none");

        // Get or create conversation state
        let [existingState] = await db
          .select()
          .from(conversationStates)
          .where(eq(conversationStates.conversationId, input.sessionId))
          .limit(1);

        let currentState: IntakeState;

        if (!existingState) {
          // Initialize new state
          currentState = initializeIntakeState(input.sessionId);
        } else {
          // Parse existing state with new minimal booking flow fields
          currentState = {
            sessionId: existingState.conversationId,
            currentStep: existingState.nextStep as any,
            completedSteps: existingState.completedSteps ? JSON.parse(existingState.completedSteps) : [],
            askedKeys: existingState.askedKeys ? JSON.parse(existingState.askedKeys) : [],
            name: existingState.name,
            phone: existingState.phone,
            email: existingState.email,
            emailSkipped: existingState.emailSkipped === 1,
            classFor: existingState.classFor as any,
            childName: (existingState as any).childName || null,
            intent: existingState.intent as any,
            selectedLocation: (existingState as any).selectedLocation || null,
            selectedPlanId: existingState.selectedPlanId || null,
            childAge: existingState.childAge,
            segment: existingState.segment as any,
            program: existingState.program,
            selectedSlot: existingState.selectedSlotId ? { id: existingState.selectedSlotId, day: "", date: "", time: "", displayText: "" } : null,
            
            // NEW - Trial-First Strategy fields
            emotionalGoal: (existingState as any).emotionalGoal || null,
            emotionalImpact: (existingState as any).emotionalImpact || null,
            priorTraining: (existingState as any).priorTraining || null,
            skipTrial: (existingState as any).skipTrial || false,
            secondaryDecisionMaker: (existingState as any).secondaryDecisionMaker || null,
            offeredSlots: (existingState as any).offeredSlots ? JSON.parse((existingState as any).offeredSlots) : [],
            
            multipleChildren: (existingState as any).multipleChildren || false,
            childCount: (existingState as any).childCount || 0,
            children: (existingState as any).children ? JSON.parse((existingState as any).children) : [],
            currentChildIndex: (existingState as any).currentChildIndex || 0,
            messageHistory: (existingState as any).messageHistory ? JSON.parse((existingState as any).messageHistory) : [],
            intakeComplete: existingState.nextStep === "COMPLETE",
          };
        }

        // Log previous step before processing
        const prevStep = currentState.currentStep;
        console.log("[Intake Step] prevStep:", prevStep);

        // Process message through state machine (no intent detection in Phase 1)
        const response = processIntakeMessage(currentState, input.message);

        // RELIABILITY KERNEL: Log state changes
        const newStep = response.state.currentStep;
        console.log("[Intake Step] newStep:", newStep);
        console.log("[Intake Step] stateDiff:", {
          name: currentState.name !== response.state.name ? `${currentState.name} → ${response.state.name}` : "unchanged",
          phone: currentState.phone !== response.state.phone ? `${currentState.phone} → ${response.state.phone}` : "unchanged",
          email: currentState.email !== response.state.email ? `${currentState.email} → ${response.state.email}` : "unchanged",
          classFor: currentState.classFor !== response.state.classFor ? `${currentState.classFor} → ${response.state.classFor}` : "unchanged",
          childAge: currentState.childAge !== response.state.childAge ? `${currentState.childAge} → ${response.state.childAge}` : "unchanged",
          step: prevStep !== newStep ? `${prevStep} → ${newStep}` : "unchanged",
        });

        // Persist updated state
        const stateToSave = {
          conversationId: input.sessionId,
          name: response.state.name,
          phone: response.state.phone,
          email: response.state.email,
          emailSkipped: response.state.emailSkipped ? 1 : 0,
          classFor: response.state.classFor,
          intent: response.state.intent,
          selectedPlanId: response.state.selectedPlanId,
          childAge: response.state.childAge,
          segment: response.state.segment,
          program: response.state.program,
          nextStep: response.state.currentStep,
          askedKeys: JSON.stringify(response.state.askedKeys),
          // New fields for minimal booking flow
          completedSteps: JSON.stringify(response.state.completedSteps),
          selectedSlotId: response.state.selectedSlot?.id || null,
        };

        if (!existingState) {
          // Insert new state
          await db.insert(conversationStates).values(stateToSave);
        } else {
          // Update existing state
          await db
            .update(conversationStates)
            .set(stateToSave)
            .where(eq(conversationStates.conversationId, input.sessionId));
        }

        // FETCH MEMBERSHIP PLANS: If we just transitioned to PLAN_SELECTION step, fetch available plans
        let plansToReturn = response.membershipPlans || [];
        if (response.state.currentStep === "PLAN_SELECTION") {
          try {
            const { membershipPackages } = await import("../drizzle/schema");
            const plans = await db.select().from(membershipPackages).where(eq(membershipPackages.isActive, 1));
            
            plansToReturn = plans.map(p => ({
              id: p.id,
              name: p.name,
              monthlyPrice: p.monthlyPrice,
              totalPrice: p.totalPrice,
              durationMonths: p.durationMonths,
              description: p.description,
              benefits: p.benefits ? JSON.parse(p.benefits) : [],
            }));
            
            console.log("[IntakeStep] Fetched membership plans for PLAN_SELECTION step:", plansToReturn.length, "plans");
          } catch (error) {
            console.error("[IntakeStep] Failed to fetch membership plans:", error);
            // Continue with empty plans - user can still proceed
          }
        }

        // FETCH SCHEDULES: If we just transitioned to SLOTS step, fetch available schedules
        let slotsToReturn = response.availableSlots || [];
        if (response.state.currentStep === "SLOTS" && response.state.program) {
          try {
            const nextClasses = await getNextClassTimes(
              response.state.program,
              response.state.selectedLocation || "Tomball HQ", // Use selected location
              6 // Get 6 options
            );
            
            // Convert to slot format expected by frontend
            slotsToReturn = nextClasses.map(c => ({
              id: c.id.toString(),
              day: c.dayOfWeek,
              date: "", // Will be calculated from dayOfWeek
              time: `${c.startTime} - ${c.endTime}`,
              displayText: formatClassTime(c),
            }));
            
            console.log("[IntakeStep] Fetched schedules for SLOTS step:", slotsToReturn.length, "slots");
          } catch (error) {
            console.error("[IntakeStep] Failed to fetch schedules:", error);
            // Continue with empty slots - user can still proceed
          }
        }

        // If intake is complete, route based on intent (trial booking vs enrollment)
        if (response.state.intakeComplete && response.state.name && response.state.phone) {
          console.log("[IntakeStep] Intake complete check:", {
            intent: response.state.intent,
            selectedPlanId: response.state.selectedPlanId,
            intakeComplete: response.state.intakeComplete,
            name: response.state.name,
            phone: response.state.phone,
          });
          // Check if this is enrollment flow (plan selected)
          if (response.state.intent === "enroll" && response.state.selectedPlanId) {
            // Return enrollment data for Fluid Pay inline checkout
            try {
              console.log("[Enrollment] selectedPlanId:", response.state.selectedPlanId);
              const [membershipPackage] = await db.select().from(schema.membershipPackages).where(eq(schema.membershipPackages.id, response.state.selectedPlanId));
              if (!membershipPackage || !membershipPackage.fluidpayPlanId) {
                throw new Error(`Membership package not found or not configured for Fluid Pay: ${response.state.selectedPlanId}`);
              }
              const customerName = response.state.name || "Guest";
              const customerPhone = response.state.phone || "";
              const customerEmail = response.state.email || "";
              const studentName = response.state.childName || response.state.name || "";
              return {
                assistantMessage: `Perfect! Your **${membershipPackage.name}** membership enrollment is ready. Please enter your card details below to complete your enrollment.`,
                state: response.state,
                collectedFields: response.collectedFields,
                nextExpectedField: null,
                availableSlots: [],
                quickReplies: [],
                error: null,
                enrollmentData: {
                  packageId: membershipPackage.id,
                  packageName: membershipPackage.name,
                  downPayment: parseFloat(membershipPackage.downPayment as string),
                  enrollmentFee: parseFloat((membershipPackage.enrollmentFee as string) || '99.00'),
                  monthlyPrice: parseFloat(membershipPackage.monthlyPrice as string),
                  durationMonths: membershipPackage.durationMonths,
                  customerName,
                  customerEmail,
                  customerPhone,
                  studentName,
                },
              };
            } catch (error) {
              console.error("[Enrollment Checkout Error]", error);
              return {
                assistantMessage: "Sorry, there was an issue preparing your enrollment. Please contact us at (877) 4-MYDOJO to complete your enrollment.",
                state: response.state,
                collectedFields: response.collectedFields,
                nextExpectedField: null,
                availableSlots: [],
                quickReplies: [],
                error: "checkout_creation_failed",
              };
            }
          }
          
          // Trial booking flow
          const { createAtomicBooking, getAlternativeSlots } = await import("./atomicBooking");
          
          // Generate bookingRequestId if not provided
          const bookingRequestId = input.bookingRequestId || `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Atomic booking with transaction
          const bookingResult = await createAtomicBooking(db, response.state, bookingRequestId);
          
          if (bookingResult.success) {
            // Success - return confirmation
            return {
              assistantMessage: bookingResult.message,
              state: response.state,
              collectedFields: response.collectedFields,
              nextExpectedField: null,
              availableSlots: [],
              quickReplies: [],
              error: null,
            };
          } else {
            // Failure - return structured error with alternatives
            if (bookingResult.reason === "slot_unavailable" && bookingResult.alternatives) {
              return {
                assistantMessage: `${bookingResult.message}\n\nHere are some alternative times:`,
                state: response.state,
                collectedFields: response.collectedFields,
                nextExpectedField: response.nextExpectedField,
                availableSlots: bookingResult.alternatives,
                quickReplies: [],
                error: null,
              };
            } else if (bookingResult.reason === "validation_error") {
              return {
                assistantMessage: `${bookingResult.message}\n\nLet's make sure we have everything correct before booking.`,
                state: response.state,
                collectedFields: response.collectedFields,
                nextExpectedField: response.nextExpectedField,
                availableSlots: response.availableSlots || [],
                quickReplies: response.quickReplies || [],
                error: bookingResult.message,
              };
            } else {
              // Server error - create staff callback and stop retry loop
              console.error("[IntakeStep] Booking failed with server error", {
                bookingRequestId,
                debugMessage: bookingResult.debugMessage,
                reason: bookingResult.reason,
              });
              
              // RELIABILITY KERNEL: Save lead and create staff callback (no retry loop)
              const { createStaffCallback } = await import("./staffCallback");
              const callbackResult = await createStaffCallback(
                db,
                response.state,
                `Booking failed: ${bookingResult.reason} - ${bookingResult.message}`
              );
              
              // RELIABILITY KERNEL: Surface real errors in dev mode
              const isDev = process.env.NODE_ENV === "development";
              const errorMessage = isDev && bookingResult.debugMessage
                ? `${bookingResult.message}\n\n⚠️ DEV ERROR:\n${bookingResult.debugMessage}\n\n📞 Staff callback created: ${callbackResult.success ? 'Yes' : 'Failed'}`
                : `${bookingResult.message}\n\nDon't worry - we've saved your information and our team will reach out to you shortly at ${response.state.phone}.`;
              
              return {
                assistantMessage: errorMessage,
                state: response.state,
                collectedFields: response.collectedFields,
                nextExpectedField: response.nextExpectedField,
                availableSlots: response.availableSlots || [],
                quickReplies: ["Try again", "Talk to staff"],
                error: bookingResult.debugMessage || bookingResult.message,
              };
            }
          }
        }

        return {
          assistantMessage: response.assistantMessage,
          state: response.state,
          collectedFields: response.collectedFields,
          nextExpectedField: response.nextExpectedField,
          availableSlots: slotsToReturn,
          membershipPlans: plansToReturn,
          quickReplies: response.quickReplies || [],
          error: response.error,
        };
      }),

    /**
     * Get initial greeting for intake flow
     */
    getIntakeGreeting: publicProcedure.query(() => {
      return { message: getInitialGreeting() };
    }),

    /**
     * Trial-First Strategy V2 - Get initial greeting
     * Feature flag: KAI_TRIAL_FIRST_V2=true
     * Fetches real weather from Open-Meteo (cached 15 min) for Kai's greeting.
     */
    getIntakeGreetingV2: publicProcedure.query(async () => {
      // Fetch real weather for Tomball, TX — falls back gracefully if unavailable
      const weatherHook = await getWeatherGreetingHook();
      const greeting = getTFGreeting(weatherHook);
      return {
        message: greeting.message,
        quickReplies: greeting.quickReplies || [],
        state: greeting.state,
        devInfo: greeting.devInfo || null,
      };
    }),

    /**
     * Trial-First Strategy V2 - Process one step per user turn
     * Feature flag: KAI_TRIAL_FIRST_V2=true
     * Design: one step = one user turn, no recursion, no auto-advance
     */
    intakeStepV2: publicProcedure
      .input(z.object({
        message: z.string(),
        sessionId: z.string(),
        state: z.any().optional(), // Client passes back the state from previous turn
      }))
      .mutation(async ({ input }) => {
        const isDev = process.env.NODE_ENV === "development" || process.env.KAI_DEBUG === "true";

        console.log("[IntakeV2] === NEW TURN ===");
        console.log("[IntakeV2] sessionId:", input.sessionId);
        console.log("[IntakeV2] message:", input.message.slice(0, 100));

        // Restore state from client (stateless approach for V2)
        // If no state provided, create fresh state
        let currentState: TFState;
        if (input.state) {
          // Reconstruct state from client payload
          currentState = {
            ...createTFState(),
            ...input.state,
            // Ensure step is a valid TFStep enum value
            step: (input.state.step as TFStep) || TFStep.GREETING,
            prevStep: (input.state.prevStep as TFStep | null) || null,
          };
        } else {
          currentState = createTFState();
        }

        console.log("[IntakeV2] currentStep:", currentState.step);

        // ── Age-to-program routing ──────────────────────────────────────────────
        // Map child age to the correct program so slots are filtered accurately
        function ageToProgram(age: number | null): string {
          if (age === null) return "Little Ninjas"; // safe default
          if (age <= 5) return "Little Ninjas";
          if (age <= 12) return "Dragon Kids";
          if (age <= 17) return "Teens";
          return "Adult Karate"; // 18+
        }

        // ── Inject real schedule slots before TRIAL_TRANSITION ─────────────────
        // When the state machine is about to present slots, pre-populate
        // offeredSlots from the real DB schedule filtered by program.
        const isAboutToOfferSlots =
          currentState.step === TFStep.TRIAL_TRANSITION ||
          (currentState.step === TFStep.EMOTIONAL_DISCOVERY_Q2 && currentState.offeredSlots.length === 0);

        if (isAboutToOfferSlots && currentState.offeredSlots.length === 0) {
          try {
            // Determine which program to query
            let targetProgram: string;
            if (currentState.classFor === "child") {
              targetProgram = ageToProgram(currentState.childAge);
            } else if (currentState.classFor === "self" || currentState.classFor === "other") {
              // Adults default to Adult Karate; if they expressed interest in kickboxing use that
              const historyText = currentState.history.map(h => h.content).join(" ").toLowerCase();
              targetProgram = historyText.includes("kickbox") ? "Kickboxing" : "Adult Karate";
            } else {
              targetProgram = "Adult Karate";
            }

            const dbClasses = await getNextClassTimes(targetProgram, "Tomball HQ", 6);
            if (dbClasses.length > 0) {
              const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
              // Always compute "today" in CST (America/Chicago) so day labels are correct
              // regardless of the server's local timezone
              const nowCSTStr = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
              const nowCST = new Date(nowCSTStr);
              const todayIndexCST = nowCST.getDay();
              const realSlots: import("./intakeStateMachine.trialFirst").TFSlot[] = [];

              for (const cls of dbClasses) {
                // Find the next calendar date for this day of week (relative to CST today)
                const targetDayIndex = days.indexOf(cls.dayOfWeek);
                if (targetDayIndex === -1) continue;
                let daysAhead = (targetDayIndex - todayIndexCST + 7) % 7;
                if (daysAhead === 0) {
                  // Same day as today in CST — check if the class time has already passed
                  const [timePart, ampm] = cls.startTime.split(" ");
                  const [hourStr, minStr] = timePart.split(":");
                  let classHour = parseInt(hourStr, 10);
                  const classMin = parseInt(minStr || "0", 10);
                  if (ampm?.toUpperCase() === "PM" && classHour !== 12) classHour += 12;
                  if (ampm?.toUpperCase() === "AM" && classHour === 12) classHour = 0;
                  const classMinutesFromMidnight = classHour * 60 + classMin;
                  const nowMinutesFromMidnight = nowCST.getHours() * 60 + nowCST.getMinutes();
                  // If class already started or is within 30 min, skip to next week
                  if (classMinutesFromMidnight <= nowMinutesFromMidnight + 30) {
                    daysAhead = 7;
                  }
                }

                const isTomorrow = daysAhead === 1;
                let dayLabel: string;
                if (isTomorrow) dayLabel = "tomorrow";
                else dayLabel = cls.dayOfWeek;

                realSlots.push({
                  id: `slot-${cls.dayOfWeek}-${cls.startTime}`.replace(/\s/g, "-"),
                  displayText: `${dayLabel} at ${cls.startTime} CST`,
                  dayOfWeek: cls.dayOfWeek,
                  time: cls.startTime,
                });
              }

              if (realSlots.length > 0) {
                currentState.offeredSlots = realSlots;
                console.log(`[IntakeV2] Pre-populated ${realSlots.length} real slots for program: ${targetProgram}`);
              }
            }
          } catch (err) {
            console.error("[IntakeV2] Failed to load schedule slots from DB:", err);
            // Fall through — generateDefaultSlots() in state machine will be used as fallback
          }
        }

        // Process the message through the Trial-First state machine
        const response = processTFMessage(currentState, input.message);

        console.log("[IntakeV2] nextStep:", response.state.step);
        console.log("[IntakeV2] isDone:", response.isDone);
        console.log("[IntakeV2] selectedProgramForCheckout:", response.selectedProgramForCheckout);

        // If user selected a program, prepare Fluid Pay enrollment data
        let checkoutUrl: string | null = null;
        let enrollmentData: Record<string, unknown> | null = null;
        let checkoutMessage = response.message;
        if (response.selectedProgramForCheckout) {
          try {
            const planName = response.selectedProgramForCheckout;
            const planIdMap: Record<string, number> = { "Foundation": 1, "Black Belt": 2 };
            const planId = planIdMap[planName];
            if (planId) {
              const db = await getDb();
              const [membershipPackage] = await db!.select()
                .from(schema.membershipPackages)
                .where(eq(schema.membershipPackages.id, planId));
              if (membershipPackage && membershipPackage.fluidpayPlanId) {
                enrollmentData = {
                  packageId: membershipPackage.id,
                  packageName: membershipPackage.name,
                  downPayment: parseFloat(membershipPackage.downPayment as string),
                  enrollmentFee: parseFloat((membershipPackage.enrollmentFee as string) || '99.00'),
                  monthlyPrice: parseFloat(membershipPackage.monthlyPrice as string),
                  durationMonths: membershipPackage.durationMonths,
                  customerName: response.state.name || "",
                  customerEmail: response.state.email || "",
                  customerPhone: response.state.phone || "",
                  studentName: response.state.childName || response.state.name || "",
                };
                checkoutMessage = `Your **${planName}** enrollment is ready! Please enter your card details below to complete your enrollment securely.

We can't wait to welcome you to the dojo! 🥋`;
                console.log("[IntakeV2] Fluid Pay enrollment data prepared for plan:", planId);
              } else {
                console.warn("[IntakeV2] No Fluid Pay plan ID found for plan:", planName);
                checkoutMessage = `Your **${planName}** enrollment is ready! Please contact us at (877) 4-MYDOJO to complete your registration, or visit our front desk.`;
              }
            }
          } catch (err) {
            console.error("[IntakeV2] Fluid Pay enrollment error:", err);
            checkoutMessage = `Great choice! Please contact us at (877) 4-MYDOJO to complete your **${response.selectedProgramForCheckout}** enrollment, or visit our front desk.`;
          }
        }

        // Handle Summer Camp checkout with Fluid Pay
        if (response.selectedSummerCampForCheckout) {
          try {
            const weekLabel = response.selectedSummerCampForCheckout;
            // Summer camp: $199 + $99 registration = $298 total, charged as one-time via Fluid Pay
            const summerCampEnrollmentData = {
              type: "summer_camp",
              weekLabel,
              totalAmount: 298, // $298 total
              customerName: response.state.name || "",
              customerEmail: response.state.email || "",
              customerPhone: response.state.phone || "",
              childName: response.state.childName || "",
            };
            enrollmentData = summerCampEnrollmentData;
            checkoutMessage = `Your Summer Camp registration for **${weekLabel}** is ready! ☀️

Please enter your card details below to complete your registration securely. Total: **$298** ($199 camp fee + $99 registration).

🥋 Free Gi uniform, water bottle & school T-shirt included!`;
            response.state.enrollmentCheckoutUrl = "pending_fluid_pay";
            console.log("[IntakeV2] Summer Camp Fluid Pay enrollment data prepared");
          } catch (err) {
            console.error("[IntakeV2] Summer Camp enrollment error:", err);
            checkoutMessage = `Your Summer Camp registration for **${response.selectedSummerCampForCheckout}** is ready! Please contact us at (877) 4-MYDOJO to complete your registration, or visit our front desk.`;
          }
        }

        // Handle upgrade actions (lookup or execute)
        let upgradeResult: {
          found: boolean;
          message: string;
          currentPlan?: string;
          currentPlanMonthlyPrice?: number;
          proratedCredit?: number;
          enrollmentId?: number;
          upgraded?: boolean;
        } | null = null;

        if (response.upgradeAction) {
          const { lookupPhone, targetPlan, enrollmentId } = response.upgradeAction;
          const stripeClient = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, { apiVersion: "2026-01-28.clover" });
          const db = await getDb();

          if (!targetPlan) {
            // LOOKUP phase: find the student's enrollment by phone or email
            const digits = lookupPhone.replace(/\D/g, "");
            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookupPhone);

            let enrollment = null;
            if (isEmail) {
              const rows = await db!.select()
                .from(schema.enrollments)
                .where(eq(schema.enrollments.customerEmail, lookupPhone.toLowerCase()))
                .orderBy(desc(schema.enrollments.createdAt))
                .limit(1);
              enrollment = rows[0] ?? null;
            } else {
              // Try multiple phone formats
              const phoneFormats = [
                digits,
                `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`,
                `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`,
              ];
              for (const fmt of phoneFormats) {
                const rows = await db!.select()
                  .from(schema.enrollments)
                  .where(eq(schema.enrollments.customerPhone, fmt))
                  .orderBy(desc(schema.enrollments.createdAt))
                  .limit(1);
                if (rows[0]) { enrollment = rows[0]; break; }
              }
            }

            if (!enrollment) {
              upgradeResult = {
                found: false,
                message: `I couldn't find an account with that ${isEmail ? "email" : "phone number"}. Please double-check and try again, or contact us at (877) 4-MYDOJO.`,
              };
            } else {
              // Get current plan info
              const [pkg] = await db!.select()
                .from(schema.membershipPackages)
                .where(eq(schema.membershipPackages.id, enrollment.membershipPackageId));

              let proratedCredit = 0;
              if (enrollment.stripeSubscriptionId) {
                try {
                  const sub = await stripeClient.subscriptions.retrieve(enrollment.stripeSubscriptionId);
                  const periodEnd = sub.items?.data?.[0]?.current_period_end;
                  const periodStart = sub.items?.data?.[0]?.current_period_start;
                  if (periodEnd && periodStart) {
                    const totalDays = (periodEnd - periodStart) / 86400;
                    const daysRemaining = (periodEnd - Math.floor(Date.now() / 1000)) / 86400;
                    const monthlyPrice = pkg ? parseFloat(pkg.monthlyPrice as string) : 149;
                    proratedCredit = Math.max(0, (daysRemaining / totalDays) * monthlyPrice);
                    proratedCredit = Math.round(proratedCredit * 100) / 100;
                  }
                } catch (e) {
                  console.error("[Upgrade] Failed to fetch subscription for proration:", e);
                }
              }

              const monthlyPrice = pkg ? parseFloat(pkg.monthlyPrice as string) : 149;
              upgradeResult = {
                found: true,
                message: "", // will be overridden by state machine question
                currentPlan: pkg?.name || "Foundation",
                currentPlanMonthlyPrice: monthlyPrice,
                proratedCredit,
                enrollmentId: enrollment.id,
              };

              // Update the chatbot state with account info so UPGRADE_CONFIRM message is personalized
              response.state.currentPlan = pkg?.name || "Foundation";
              response.state.currentPlanMonthlyPrice = monthlyPrice;
              response.state.proratedCredit = proratedCredit;
              response.state.upgradeEnrollmentId = enrollment.id;

              // Re-generate the UPGRADE_CONFIRM question with the account info
              const confirmQ = generateQuestion(TFStep.UPGRADE_CONFIRM, response.state);
              checkoutMessage = confirmQ.message;
              response.quickReplies = confirmQ.quickReplies;
            }
          } else {
            // EXECUTE phase: update the Stripe subscription to the new plan
            const planNameMap: Record<string, number> = { "Foundation": 1, "Black Belt": 2, "Leadership": 3 };
            const newPlanId = planNameMap[targetPlan];

            if (!newPlanId) {
              upgradeResult = { found: false, message: `Unknown plan: ${targetPlan}` };
            } else {
              // Get the new plan's Stripe price ID
              const [newPkg] = await db!.select()
                .from(schema.membershipPackages)
                .where(eq(schema.membershipPackages.id, newPlanId));

              // Get the enrollment (by ID or by phone lookup)
              let enrollment = null;
              if (enrollmentId) {
                const rows = await db!.select()
                  .from(schema.enrollments)
                  .where(eq(schema.enrollments.id, enrollmentId))
                  .limit(1);
                enrollment = rows[0] ?? null;
              }

              if (!enrollment || !newPkg?.stripePriceId) {
                upgradeResult = {
                  found: false,
                  message: "I couldn't complete the upgrade. Please contact us at (877) 4-MYDOJO for assistance.",
                };
              } else {
                try {
                  // Retrieve the subscription and update it
                  const sub = await stripeClient.subscriptions.retrieve(enrollment.stripeSubscriptionId!);
                  const subItemId = sub.items.data[0]?.id;

                  if (subItemId) {
                    await stripeClient.subscriptions.update(enrollment.stripeSubscriptionId!, {
                      items: [{ id: subItemId, price: newPkg.stripePriceId }],
                      proration_behavior: "create_prorations",
                    });
                  }

                  // Update the enrollment in the database
                  await db!.update(schema.enrollments)
                    .set({ membershipPackageId: newPlanId, updatedAt: new Date() })
                    .where(eq(schema.enrollments.id, enrollment.id));

                  upgradeResult = { found: true, upgraded: true, message: "" };
                  checkoutMessage = `Your membership has been upgraded to **${targetPlan}**! 🥋 You'll receive a confirmation email shortly. Is there anything else I can help you with?`;
                  response.quickReplies = ["No, thanks!"];

                  console.log(`[Upgrade] Enrollment ${enrollment.id} upgraded to ${targetPlan}`);
                } catch (err) {
                  console.error("[Upgrade] Stripe subscription update failed:", err);
                  upgradeResult = {
                    found: false,
                    message: "There was an issue upgrading your subscription. Please contact us at (877) 4-MYDOJO and we'll take care of it right away.",
                  };
                  checkoutMessage = upgradeResult.message;
                }
              }
            }
          }

           // If lookup failed, override the message
          if (upgradeResult && !upgradeResult.found) {
            checkoutMessage = upgradeResult.message;
            // Reset state back to UPGRADE_LOOKUP so user can try again
            response.state.step = TFStep.UPGRADE_LOOKUP;
          }
        }
        // ── Weather-aware slot confirmation ───────────────────────────────────
        // When the conversation is done (slot confirmed), append a weather comment
        // for the appointment day so Kai can warn about bad weather or celebrate clear skies.
        if (response.isDone && response.state.selectedSlot) {
          try {
            const slot = response.state.selectedSlot;
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            // Use CST/CDT (America/Chicago) for day-of-week so Monday in Tomball is Monday, not UTC Tuesday
            const nowCST = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
            const targetDayIdx = days.indexOf(slot.dayOfWeek);
            if (targetDayIdx !== -1) {
              const todayIdx = nowCST.getDay();
              let daysAhead = (targetDayIdx - todayIdx + 7) % 7;
              if (daysAhead === 0) daysAhead = 7;
              const apptDate = new Date(nowCST);
              apptDate.setDate(nowCST.getDate() + daysAhead);
              // Parse the slot time (e.g. "5:00 PM") and set on the date
              const timeParts = slot.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
              if (timeParts) {
                let hours = parseInt(timeParts[1]);
                const minutes = parseInt(timeParts[2]);
                const ampm = timeParts[3].toUpperCase();
                if (ampm === "PM" && hours !== 12) hours += 12;
                if (ampm === "AM" && hours === 12) hours = 0;
                apptDate.setHours(hours, minutes, 0, 0);
              }
              // Only fetch weather for slots within 7 days (Open-Meteo forecast limit)
              const weather = await getWeatherForSlot(apptDate);
              if (weather.kaiComment) {
                checkoutMessage = checkoutMessage + "\n\n" + weather.kaiComment;
                if (weather.isSevere) {
                  // For severe weather, add reschedule quick reply
                  if (!response.quickReplies) response.quickReplies = [];
                  if (!response.quickReplies.includes("Reschedule for another day")) {
                    response.quickReplies = ["Reschedule for another day", ...response.quickReplies];
                  }
                }
              }
            }
          } catch (weatherErr) {
            console.warn("[IntakeV2] Weather fetch failed, skipping:", weatherErr);
          }
        }
        return {
          message: checkoutMessage,
          quickReplies: response.quickReplies || [],
          state: response.state,
          isDone: response.isDone,
          checkoutUrl,
          enrollmentData,
          upgradeResult,
          devInfo: isDev ? response.devInfo : undefined,
        };
      }),
  }),

  waiver: router({
    /**
     * Submit a waiver signature
     */
    submit: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          phone: z.string().min(1, "Phone number is required"),
          email: z.string().email("Valid email is required"),
          ipAddress: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const result = await createWaiverSignature({
          name: input.name,
          phone: input.phone,
          email: input.email,
          ipAddress: input.ipAddress,
          waiverVersion: "2026-02",
          acceptedLiability: 1,
          acceptedPhotoConsent: 1,
        });

        if (!result) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save waiver signature",
          });
        }

        return { 
          success: true, 
          id: result.insertId,
          name: input.name,
          email: input.email,
          signedAt: new Date().toISOString()
        };
      }),
  }),

  member: router({
    // Get all enrollments (instructor only)
    getAllEnrollments: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Check if user is an instructor (admin or staff role)
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only instructors can view all enrollments"
        });
      }

      // Get all enrollments with membership package details
      const enrollments = await db
        .select({
          id: schema.enrollments.id,
          customerName: schema.enrollments.customerName,
          customerEmail: schema.enrollments.customerEmail,
          customerPhone: schema.enrollments.customerPhone,
          beltRank: schema.enrollments.beltRank,
          status: schema.enrollments.status,
          stripeCustomerId: schema.enrollments.stripeCustomerId,
          stripeSubscriptionId: schema.enrollments.stripeSubscriptionId,
          stripePaymentIntentId: schema.enrollments.stripePaymentIntentId,
          downPaymentAmount: schema.enrollments.downPaymentAmount,
          remainingBalance: schema.enrollments.remainingBalance,
          monthlyPaymentsRemaining: schema.enrollments.monthlyPaymentsRemaining,
          createdAt: schema.enrollments.createdAt,
          membershipPackageId: schema.enrollments.membershipPackageId,
          discountApplied: schema.enrollments.discountApplied,
          agreementSignature: schema.enrollments.agreementSignature,
          agreementSignedAt: schema.enrollments.agreementSignedAt,
          isFrozen: schema.enrollments.isFrozen,
          freezeStartDate: schema.enrollments.freezeStartDate,
          freezeEndDate: schema.enrollments.freezeEndDate,
          cancellationRequestedAt: schema.enrollments.cancellationRequestedAt,
          cancellationEffectiveDate: schema.enrollments.cancellationEffectiveDate,
          packageName: schema.membershipPackages.name,
          packageMonthlyPrice: schema.membershipPackages.monthlyPrice,
        })
        .from(schema.enrollments)
        .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
        .orderBy(schema.enrollments.createdAt);
      
      // Fetch Stripe subscription details for each enrollment
      const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "", {
        apiVersion: "2026-01-28.clover",
      });

      const enrollmentsWithSubscriptions = await Promise.all(
        enrollments.map(async (enrollment) => {
          let subscriptionStatus = null;
          let nextPaymentDate = null;
          let subscriptionActive = false;

          if (enrollment.stripeSubscriptionId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(enrollment.stripeSubscriptionId);
              subscriptionStatus = subscription.status;
              subscriptionActive = subscription.status === 'active' || subscription.status === 'trialing';
              const periodEnd = subscription.items?.data?.[0]?.current_period_end;
              if (periodEnd) {
                nextPaymentDate = new Date(periodEnd * 1000);
              }
            } catch (error) {
              console.error(`Failed to fetch subscription for ${enrollment.stripeSubscriptionId}:`, error);
            }
          }

          return {
            ...enrollment,
            subscriptionStatus,
            nextPaymentDate,
            subscriptionActive,
          };
        })
      );
      
      return enrollmentsWithSubscriptions;
    }),

    // Get member's enrollment and subscription details
    getEnrollment: protectedProcedure.query(async ({ ctx }) => {
      const enrollment = await getMemberEnrollment(ctx.user.email);
      
      if (!enrollment) {
        return null;
      }

      // Fetch subscription details from Stripe if available
      let subscription = null;
      if (enrollment.enrollment.stripeSubscriptionId) {
        subscription = await getMemberSubscription(enrollment.enrollment.stripeSubscriptionId);
      }

      return {
        enrollment: enrollment.enrollment,
        package: enrollment.package,
        subscription,
      };
    }),

    // Get member's class schedules
    getClassSchedules: protectedProcedure.query(async ({ ctx }) => {
      const enrollment = await getMemberEnrollment(ctx.user.email);
      
      if (!enrollment || !enrollment.package) {
        return [];
      }

      const schedules = await getMemberClassSchedules(enrollment.package.name);
      return schedules;
    }),

     // Get member's payment history (FluidPay primary + Stripe fallback)
    getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
      const payments = await getMemberPaymentHistory(ctx.user.email);
      return payments;
    }),

    // Submit a membership change request (pause or cancel)
    requestChange: protectedProcedure
      .input(
        z.object({
          requestType: z.enum(["pause", "cancel"]),
          reason: z.string().min(10, "Please provide a detailed reason (at least 10 characters)"),
          effectiveDate: z.date().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const enrollment = await getMemberEnrollment(ctx.user.email);
        
        if (!enrollment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active enrollment found",
          });
        }

        const request = await createChangeRequest({
          enrollmentId: enrollment.enrollment.id,
          userId: ctx.user.id,
          requestType: input.requestType,
          reason: input.reason,
          effectiveDate: input.effectiveDate,
        });

        return { success: true, requestId: request.id };
      }),

    // Get member's change requests
    getChangeRequests: protectedProcedure.query(async ({ ctx }) => {
      const requests = await getUserChangeRequests(ctx.user.id);
      return requests;
    }),

    // Admin: Get all pending change requests
    getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const requests = await getPendingChangeRequests();
      return requests;
    }),

    // Admin: Approve a change request
    approveRequest: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        const request = await approveChangeRequest(
          input.requestId,
          ctx.user.id,
          input.adminNotes
        );

        return { success: true, request };
      }),

    // Admin: Deny a change request
    denyRequest: protectedProcedure
      .input(
        z.object({
          requestId: z.number(),
          adminNotes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
          });
        }

        const request = await denyChangeRequest(
          input.requestId,
          ctx.user.id,
          input.adminNotes
        );

        return { success: true, request };
      }),

    // Add student information after enrollment payment
    addStudentInfo: protectedProcedure
      .input(
        z.object({
          studentName: z.string().min(1, "Student name is required"),
          dateOfBirth: z.string().min(1, "Date of birth is required"), // YYYY-MM-DD
          program: z.enum(["Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp"]),
          emergencyContactName: z.string().optional(),
          emergencyContactPhone: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Get the parent's enrollment
        const enrollment = await getMemberEnrollment(ctx.user.email);
        if (!enrollment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'No active enrollment found' });
        }

        // Check if a student record already exists for this enrollment
        const existing = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.leadId, enrollment.enrollment.id))
          .limit(1);

        if (existing.length > 0) {
          // Update existing student record
          await db
            .update(schema.students)
            .set({
              name: input.studentName,
              dateOfBirth: input.dateOfBirth,
              program: input.program,
              emergencyContactName: input.emergencyContactName || null,
              emergencyContactPhone: input.emergencyContactPhone || null,
              status: 'active',
              updatedAt: new Date(),
            })
            .where(eq(schema.students.id, existing[0].id));
          return { success: true, studentId: existing[0].id, updated: true };
        }

        // Create new student record linked to enrollment
        const result = await db
          .insert(schema.students)
          .values({
            leadId: enrollment.enrollment.id,
            name: input.studentName,
            dateOfBirth: input.dateOfBirth,
            program: input.program,
            emergencyContactName: input.emergencyContactName || null,
            emergencyContactPhone: input.emergencyContactPhone || null,
            status: 'active',
            location: 'Tomball HQ',
          });

        return { success: true, studentId: (result as any).insertId, updated: false };
      }),

    // Get student info for the current member
    getStudentInfo: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const enrollment = await getMemberEnrollment(ctx.user.email);
      if (!enrollment) return null;

      const students = await db
        .select()
        .from(schema.students)
        .where(eq(schema.students.leadId, enrollment.enrollment.id))
        .limit(1);

      return students[0] ?? null;
    }),

    // Get progress stats for the student dashboard Progress tab
    getProgressStats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Find enrollment by user email
      const enrollmentRows = await db
        .select({
          id: schema.enrollments.id,
          beltRank: schema.enrollments.beltRank,
          beltAchievedDate: schema.enrollments.beltAchievedDate,
          currentStreak: schema.enrollments.currentStreak,
          longestStreak: schema.enrollments.longestStreak,
          totalXP: schema.enrollments.totalXP,
          studentName: schema.enrollments.studentName,
          program: schema.membershipPackages.name,
          classesAtCurrentBelt: schema.enrollments.classesAtCurrentBelt,
          currentStripePhase: schema.enrollments.currentStripePhase,
          stripesInCurrentPhase: schema.enrollments.stripesInCurrentPhase,
          beltExamEligible: schema.enrollments.beltExamEligible,
          beltExamFeePaid: schema.enrollments.beltExamFeePaid,
        })
        .from(schema.enrollments)
        .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
        .where(eq(schema.enrollments.customerEmail, ctx.user.email))
        .limit(1);

      // Alias for stripe data lookup
      const enrollmentStripeRows = enrollmentRows;

      const enrollment = enrollmentRows[0];
      if (!enrollment) {
        return {
          totalClasses: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
          beltRank: 'No Belt' as const,
          beltAchievedDate: null as Date | null,
          weeklyAttendance: [] as { week: string; count: number; weekStart: string }[],
          programBreakdown: [] as { program: string; count: number }[],
          beltHistory: [] as { belt: string; date: string; classesAtBelt: number }[],
        };
      }

      // Get all attendance records for this enrollment
      const allAttendance = await db
        .select({
          checkInDate: schema.attendance.checkInDate,
          checkInTimestamp: schema.attendance.checkInTimestamp,
          beltRankAtCheckIn: schema.attendance.beltRankAtCheckIn,
          programType: schema.attendance.programType,
        })
        .from(schema.attendance)
        .where(eq(schema.attendance.enrollmentId, enrollment.id))
        .orderBy(schema.attendance.checkInTimestamp);

      const totalClasses = allAttendance.length;

      // Build weekly attendance for the last 12 weeks
      const now = new Date();
      const weeklyAttendance: { week: string; count: number; weekStart: string }[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() - i * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStartStr = weekStart.toISOString().slice(0, 10);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);

        const count = allAttendance.filter(a => {
          const d = a.checkInDate;
          return d !== null && d >= weekStartStr && d <= weekEndStr;
        }).length;

        const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        weeklyAttendance.push({ week: label, count, weekStart: weekStartStr });
      }

      // Program breakdown
      const programMap: Record<string, number> = {};
      for (const a of allAttendance) {
        const prog = a.programType || 'General';
        programMap[prog] = (programMap[prog] || 0) + 1;
      }
      const programBreakdown = Object.entries(programMap)
        .map(([program, count]) => ({ program, count }))
        .sort((a, b) => b.count - a.count);

      // Belt history: derive from distinct beltRankAtCheckIn transitions
      const seenBelts = new Set<string>();
      const beltHistory: { belt: string; date: string; classesAtBelt: number }[] = [];
      let currentBeltClasses = 0;
      let lastBelt = '';
      for (const a of allAttendance) {
        const belt = a.beltRankAtCheckIn || 'No Belt';
        if (belt !== lastBelt) {
          if (!seenBelts.has(belt)) {
            beltHistory.push({ belt, date: a.checkInDate ?? new Date().toISOString().slice(0, 10), classesAtBelt: 0 });
            seenBelts.add(belt);
          }
          currentBeltClasses = 0;
          lastBelt = belt;
        }
        currentBeltClasses++;
        if (beltHistory.length > 0) {
          beltHistory[beltHistory.length - 1].classesAtBelt = currentBeltClasses;
        }
      }

      // If no belt history from attendance, use enrollment belt rank
      if (beltHistory.length === 0 && enrollment.beltRank) {
        beltHistory.push({
          belt: enrollment.beltRank,
          date: enrollment.beltAchievedDate
            ? new Date(enrollment.beltAchievedDate).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          classesAtBelt: totalClasses,
        });
      }

      // ── Belt progress calculation with stripe system ─────────────────────────
      const currentBelt = enrollment.beltRank ?? 'No Belt';
      const {
        computeStripeProgress,
        nextBeltRank,
        requiresBeltExam,
        BELT_EXAM_FEE,
        STRIPE_PHASES,
        totalClassesRequired,
      } = await import('../shared/const.js');
      const nextBelt = nextBeltRank(currentBelt);

      // Classes at current belt: from attendance records tagged with current belt,
      // or the stored value (covers backfilled records like Craig's 12 classes).
      const classesAtCurrentBeltFromAttendance = allAttendance.filter(a => {
        const belt = a.beltRankAtCheckIn || currentBelt;
        return belt === currentBelt;
      }).length;
      const storedClassesAtBelt = enrollmentStripeRows?.[0]?.classesAtCurrentBelt ?? 0;
      const classesAtCurrentBelt = Math.max(classesAtCurrentBeltFromAttendance, storedClassesAtBelt);

      // Compute stripe progress using the new position-based system
      const stripeData = computeStripeProgress(currentBelt, classesAtCurrentBelt);
      const classesRequired = totalClassesRequired(currentBelt);
      const beltProgressPct = Math.min(100, Math.round((classesAtCurrentBelt / Math.max(classesRequired, 1)) * 100));
      const qualifiesForTest = stripeData.allPhasesComplete;
      const needsExam = requiresBeltExam(currentBelt);

      return {
        totalClasses,
        currentStreak: enrollment.currentStreak,
        longestStreak: enrollment.longestStreak,
        totalXP: enrollment.totalXP,
        beltRank: enrollment.beltRank,
        beltAchievedDate: enrollment.beltAchievedDate,
        weeklyAttendance,
        programBreakdown,
        beltHistory,
        // Belt test readiness
        classesAtCurrentBelt,
        classesRequired,
        beltProgressPct,
        nextBelt,
        qualifiesForTest,
        // New stripe position system
        stripePhase: stripeData.phase,
        stripesInPhase: stripeData.stripesInPhase,
        stripesPerPhase: stripeData.stripesPerPhase,
        totalStripePhases: STRIPE_PHASES,
        allPhasesComplete: stripeData.allPhasesComplete,
        stripePositions: stripeData.positions,   // Array of { filled, color, phaseColor }
        isAdvancedBelt: stripeData.isAdvanced,   // true = 8 positions (4 top + 4 bottom)
        needsExam,
        beltExamFee: BELT_EXAM_FEE,
        beltExamEligible: enrollment.beltExamEligible ?? 0,
        beltExamFeePaid: enrollment.beltExamFeePaid ?? 0,
      };
    }),

    // ── Unread message count for Messages tab badge ──────────────────────────
    getUnreadMessageCount: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { unreadCount: 0 };

      // Find the enrollment linked to this user
      const enrollmentRows = await db
        .select({ id: schema.enrollments.id })
        .from(schema.enrollments)
        .where(eq(schema.enrollments.customerEmail, ctx.user.email))
        .limit(1);
      if (!enrollmentRows.length) return { unreadCount: 0 };
      const enrollmentId = enrollmentRows[0].id;

      // Find student-type conversations for this enrollment
      const convRows = await db
        .select({ id: schema.conversations.id })
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.type, "student"),
            eq(schema.conversations.enrollmentId, enrollmentId)
          )
        );
      if (!convRows.length) return { unreadCount: 0 };

      const convIds = convRows.map((c) => c.id);

      // Count messages from admin/staff that the student hasn't read yet
      const unreadRows = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.internalMessages)
        .where(
          and(
            inArray(schema.internalMessages.conversationId, convIds),
            ne(schema.internalMessages.senderRole, "user"),
            isNull(schema.internalMessages.readAt)
          )
        );

      return { unreadCount: Number(unreadRows[0]?.count ?? 0) };
    }),

    // ── Messaging: list conversations ──────────────────────────────────────
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      // Find enrollment for this user
      const enrollmentRows = await db
        .select({ id: schema.enrollments.id })
        .from(schema.enrollments)
        .where(eq(schema.enrollments.customerEmail, ctx.user.email))
        .limit(1);
      if (!enrollmentRows.length) return [];
      const enrollmentId = enrollmentRows[0].id;

      // Get student conversations
      const convRows = await db
        .select()
        .from(schema.conversations)
        .where(
          and(
            eq(schema.conversations.type, 'student'),
            eq(schema.conversations.enrollmentId, enrollmentId)
          )
        )
        .orderBy(desc(schema.conversations.updatedAt));

      // For each conversation, get the last message and unread count
      const result = await Promise.all(
        convRows.map(async (conv) => {
          const lastMsgRows = await db!
            .select()
            .from(schema.internalMessages)
            .where(eq(schema.internalMessages.conversationId, conv.id))
            .orderBy(desc(schema.internalMessages.createdAt))
            .limit(1);

          const unreadRows = await db!
            .select({ count: sql<number>`count(*)` })
            .from(schema.internalMessages)
            .where(
              and(
                eq(schema.internalMessages.conversationId, conv.id),
                ne(schema.internalMessages.senderRole, 'user'),
                isNull(schema.internalMessages.readAt)
              )
            );

          return {
            ...conv,
            lastMessage: lastMsgRows[0] ?? null,
            unreadCount: Number(unreadRows[0]?.count ?? 0),
          };
        })
      );

      return result;
    }),

    // ── Messaging: get messages in a conversation ─────────────────────────
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];

        // Verify this conversation belongs to the student
        const enrollmentRows = await db
          .select({ id: schema.enrollments.id })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.customerEmail, ctx.user.email))
          .limit(1);
        if (!enrollmentRows.length) throw new TRPCError({ code: 'FORBIDDEN' });
        const enrollmentId = enrollmentRows[0].id;

        const convRows = await db
          .select({ id: schema.conversations.id })
          .from(schema.conversations)
          .where(
            and(
              eq(schema.conversations.id, input.conversationId),
              eq(schema.conversations.enrollmentId, enrollmentId)
            )
          )
          .limit(1);
        if (!convRows.length) throw new TRPCError({ code: 'FORBIDDEN' });

        const messages = await db
          .select()
          .from(schema.internalMessages)
          .where(eq(schema.internalMessages.conversationId, input.conversationId))
          .orderBy(asc(schema.internalMessages.createdAt));

        return messages;
      }),

    // ── Messaging: student sends a reply ─────────────────────────────────
    sendMessage: protectedProcedure
      .input(z.object({ conversationId: z.number(), body: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Verify ownership
        const enrollmentRows = await db
          .select({ id: schema.enrollments.id })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.customerEmail, ctx.user.email))
          .limit(1);
        if (!enrollmentRows.length) throw new TRPCError({ code: 'FORBIDDEN' });
        const enrollmentId = enrollmentRows[0].id;

        const convRows = await db
          .select({ id: schema.conversations.id })
          .from(schema.conversations)
          .where(
            and(
              eq(schema.conversations.id, input.conversationId),
              eq(schema.conversations.enrollmentId, enrollmentId)
            )
          )
          .limit(1);
        if (!convRows.length) throw new TRPCError({ code: 'FORBIDDEN' });

        await db.insert(schema.internalMessages).values({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          senderName: ctx.user.name ?? ctx.user.email,
          senderRole: 'user',
          body: input.body,
        });

        // Touch the conversation's updatedAt
        await db
          .update(schema.conversations)
          .set({ updatedAt: new Date() })
          .where(eq(schema.conversations.id, input.conversationId));

        return { success: true };
      }),

    // ── Messaging: mark all messages in a conversation as read ──────────────
    markConversationRead: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { success: false };

        // Verify ownership
        const enrollmentRows = await db
          .select({ id: schema.enrollments.id })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.customerEmail, ctx.user.email))
          .limit(1);
        if (!enrollmentRows.length) return { success: false };
        const enrollmentId = enrollmentRows[0].id;

        const convRows = await db
          .select({ id: schema.conversations.id })
          .from(schema.conversations)
          .where(
            and(
              eq(schema.conversations.id, input.conversationId),
              eq(schema.conversations.enrollmentId, enrollmentId)
            )
          )
          .limit(1);
        if (!convRows.length) return { success: false };

        // Mark all unread instructor/staff messages as read
        await db
          .update(schema.internalMessages)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(schema.internalMessages.conversationId, input.conversationId),
              ne(schema.internalMessages.senderRole, 'user'),
              isNull(schema.internalMessages.readAt)
            )
          );

        return { success: true };
      }),
    // ── Messaging: student starts a new conversation ─────────────────────────
    createConversation: protectedProcedure
      .input(z.object({ message: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Find enrollment for this user
        const enrollmentRows = await db
          .select({ id: schema.enrollments.id, customerName: schema.enrollments.customerName })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.customerEmail, ctx.user.email))
          .limit(1);
        if (!enrollmentRows.length) throw new TRPCError({ code: 'FORBIDDEN', message: 'No enrollment found for your account.' });
        const { id: enrollmentId, customerName } = enrollmentRows[0];

        // Check if a conversation already exists for this enrollment
        const existing = await db
          .select({ id: schema.conversations.id })
          .from(schema.conversations)
          .where(
            and(
              eq(schema.conversations.type, 'student'),
              eq(schema.conversations.enrollmentId, enrollmentId)
            )
          )
          .limit(1);

        let conversationId: number;
        if (existing.length) {
          // Reuse existing conversation
          conversationId = existing[0].id;
        } else {
          // Create a new conversation
          const [conv] = await db
            .insert(schema.conversations)
            .values({
              type: 'student',
              title: customerName ?? ctx.user.name ?? ctx.user.email,
              createdBy: ctx.user.id,
              enrollmentId,
            })
            .$returningId();
          conversationId = conv.id;
        }

        // Insert the message
        await db.insert(schema.internalMessages).values({
          conversationId,
          senderId: ctx.user.id,
          senderName: ctx.user.name ?? ctx.user.email,
          senderRole: 'user',
          body: input.message,
        });

        // Touch updatedAt
        await db
          .update(schema.conversations)
          .set({ updatedAt: new Date() })
          .where(eq(schema.conversations.id, conversationId));

        return { conversationId };
      }),

    // Get active membership packages (public - used by standalone enrollment page)
    getActivePackages: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const pkgs = await db
        .select()
        .from(schema.membershipPackages)
        .where(eq(schema.membershipPackages.isActive, 1))
        .orderBy(schema.membershipPackages.id);
      return pkgs;
    }),
    // Create enrollment with Fluid Pay - accepts tokenizer token, creates customer vault, charges down payment, creates subscription
    createEnrollmentCheckout: publicProcedure
      .input(z.object({
        token: z.string(), // Fluid Pay tokenizer token (2-minute expiry)
        packageId: z.number().optional(), // not required for summer camp
        customerName: z.string(),
        customerEmail: z.string().email(),
        customerPhone: z.string(),
        studentName: z.string().optional(),
        leadId: z.number().optional(),
        discountCode: z.string().optional(),
        isSummerCamp: z.boolean().optional(),
        summerCampWeek: z.string().optional(),
        waiveEnrollmentFee: z.boolean().optional(),
        waiverReason: z.string().max(200).optional(),
        agreementSignature: z.string().max(255).optional(),
        agreementSignedAt: z.string().optional(), // ISO string
        deferTuition: z.boolean().optional(), // if true, charge only $99 enrollment fee now; defer first month tuition
        deferredTuitionDate: z.string().optional(), // YYYY-MM-DD, must be within same calendar month
        waiveDownPayment: z.boolean().optional(), // if true, $0 charged today, recurring subscription starts immediately
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Validate deferred tuition date is within the same calendar month
        if (input.deferTuition && input.deferredTuitionDate) {
          const today = new Date();
          const deferDate = new Date(input.deferredTuitionDate + 'T12:00:00');
          if (
            deferDate.getMonth() !== today.getMonth() ||
            deferDate.getFullYear() !== today.getFullYear() ||
            deferDate <= today
          ) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Deferred tuition date must be a future date within the current calendar month' });
          }
        }

        const FLUIDPAY_API_URL = 'https://app.fluidpay.com';
        const FLUIDPAY_SECRET_KEY = process.env.FLUIDPAY_SECRET_KEY;
        if (!FLUIDPAY_SECRET_KEY) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment processor not configured' });

        // Fetch membership package (not needed for summer camp)
        let pkg: typeof schema.membershipPackages.$inferSelect | undefined;
        if (!input.isSummerCamp) {
          if (!input.packageId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'packageId is required for membership enrollment' });
          const [foundPkg] = await db.select().from(schema.membershipPackages).where(eq(schema.membershipPackages.id, input.packageId));
          if (!foundPkg) throw new TRPCError({ code: 'NOT_FOUND', message: 'Membership package not found' });
          if (!foundPkg.fluidpayPlanId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Membership package not configured for Fluid Pay' });
          pkg = foundPkg;
        }

        const fpHeaders = { 'Authorization': FLUIDPAY_SECRET_KEY, 'Content-Type': 'application/json' };
        const nameParts = input.customerName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Detect promo-free (zero-cost) enrollment — skip vault creation and charge entirely
        const isPromoFree = input.token === 'PROMO_FREE';
        let fpCustomerId: string | null = null;
        let fpPaymentMethodId: string | null = null;
        let fpTransactionId: string | null = null;

        if (!isPromoFree) {
          // Step 1: Create Customer Vault with tokenized card
          const customerRes = await fetch(`${FLUIDPAY_API_URL}/api/vault/customer`, {
            method: 'POST',
            headers: fpHeaders,
            body: JSON.stringify({
              description: `MyDojo member: ${input.customerName}`,
              default_payment: { token: input.token },
              default_billing_address: {
                first_name: firstName,
                last_name: lastName,
                email: input.customerEmail,
                phone: input.customerPhone.replace(/\D/g, ''),
              },
            }),
          });
          const customerData = await customerRes.json();
          if (customerData.status !== 'success') {
            console.error('[FluidPay] Customer vault creation failed:', customerData);
            throw new TRPCError({ code: 'BAD_REQUEST', message: customerData.msg || 'Failed to save payment method' });
          }
          fpCustomerId = customerData.data.id;
          fpPaymentMethodId = customerData.data.data?.customer?.defaults?.payment_method_id;

          // Step 2: Charge the initial amount
          let chargeCents: number;
          let chargeDescription: string;
          if (input.isSummerCamp) {
            // Summer camp: $199 camp fee + $99 registration = $298 flat
            chargeCents = 29800;
            chargeDescription = `MyDojo Summer Camp - ${input.summerCampWeek || 'Registration'}`;
          } else if (input.waiveDownPayment) {
            // Full down payment waived: $0 charged today, recurring subscription starts immediately
            chargeCents = 0;
            chargeDescription = `MyDojo ${pkg!.name} Membership - Down Payment Waived`;
          } else if (input.deferTuition) {
            // Deferred tuition: charge only the $99 enrollment fee now; first month tuition charged later
            const enrollmentFeeAmt = parseFloat((pkg!.enrollmentFee ?? '99') as string);
            chargeCents = Math.round(enrollmentFeeAmt * 100);
            chargeDescription = `MyDojo ${pkg!.name} Membership - Enrollment Fee (Tuition deferred to ${input.deferredTuitionDate || 'later this month'})`;
          } else {
            // Membership: down payment (first month + enrollment fee), optionally waived
            const downPaymentAmt = parseFloat(pkg!.downPayment as string);
            const enrollmentFeeAmt = parseFloat((pkg!.enrollmentFee ?? '99') as string);
            const effectiveCharge = input.waiveEnrollmentFee
              ? Math.max(0, downPaymentAmt - enrollmentFeeAmt)
              : downPaymentAmt;
            chargeCents = Math.round(effectiveCharge * 100);
            chargeDescription = input.waiveEnrollmentFee
              ? `MyDojo ${pkg!.name} Membership - First Month (Enrollment Fee Waived${input.waiverReason ? ': ' + input.waiverReason : ''})`
              : `MyDojo ${pkg!.name} Membership - Down Payment`;
          }

          // Skip charge if amount is $0 (waiveDownPayment path)
          if (chargeCents > 0) {
            const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
              method: 'POST',
              headers: fpHeaders,
              body: JSON.stringify({
                type: 'sale',
                amount: chargeCents,
                currency: 'usd',
                payment_method: { customer: { id: fpCustomerId, payment_method_type: 'card', payment_method_id: fpPaymentMethodId } },
                billing_address: { first_name: firstName, last_name: lastName, email: input.customerEmail, phone: input.customerPhone.replace(/\D/g, '') },
                order_meta: { description: chargeDescription },
              }),
            });
            const chargeData = await chargeRes.json();
            if (chargeData.status !== 'success' || chargeData.data?.response_body?.card?.processor_response_code !== '00') {
              console.error('[FluidPay] Charge failed:', chargeData);
              const msg = chargeData.data?.response_body?.card?.processor_response_text || chargeData.msg || 'Payment declined';
              throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
            }
            fpTransactionId = chargeData.data?.id;
          }
        } // end !isPromoFree

        // Step 3: Create recurring subscription for monthly billing (membership only, skip for promo-free)
        let fpSubscriptionId: string | null = null;
        if (!isPromoFree && !input.isSummerCamp && pkg && fpCustomerId) {
          // If down payment waived, start subscription today; otherwise start next month (first month already charged)
          const subStartDate = input.waiveDownPayment ? new Date() : (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })();
          const startDate = subStartDate.toISOString().slice(0, 10);
          const subscriptionRes = await fetch(`${FLUIDPAY_API_URL}/api/recurring/subscription`, {
            method: 'POST',
            headers: fpHeaders,
            body: JSON.stringify({
              plan_id: pkg.fluidpayPlanId,
              customer_id: fpCustomerId,
              description: `MyDojo ${pkg.name} Monthly Membership`,
              start: startDate,
            }),
          });
          const subscriptionData = await subscriptionRes.json();
          if (subscriptionData.status !== 'success') {
            console.error('[FluidPay] Subscription creation failed:', subscriptionData);
          }
          fpSubscriptionId = subscriptionData.data?.id || null;
        }

        // Step 4: Create enrollment record in database
        let enrollmentId: number | null = null;
        let packageName: string;
        let amountCharged: number;

        if (input.isSummerCamp) {
          packageName = `Summer Camp - ${input.summerCampWeek || 'Registration'}`;
          amountCharged = 298;
          const insertResult = await db.insert(schema.enrollments).values({
            membershipPackageId: 0, // 0 = summer camp (no membership package)
            leadId: input.leadId || null,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            studentName: input.studentName || input.customerName,
            fluidpayCustomerId: fpCustomerId,
            fluidpaySubscriptionId: null,
            stripePaymentIntentId: fpTransactionId,
            downPaymentAmount: '298.00',
            paidFirstMonth: 1,
            remainingBalance: '0.00',
            monthlyPaymentsRemaining: 0,
            status: 'active',
            discountApplied: input.discountCode || null,
            agreementSignature: input.agreementSignature || null,
            agreementSignedAt: input.agreementSignedAt ? new Date(input.agreementSignedAt) : null,
            startDate: new Date(),
          });
          enrollmentId = (insertResult as any).insertId;
        } else if (input.deferTuition) {
          // Deferred tuition path: only $99 enrollment fee charged now; first month tuition deferred
          const enrollmentFeeAmt = parseFloat((pkg!.enrollmentFee ?? '99') as string);
          const monthlyPrice = parseFloat(pkg!.monthlyPrice as string);
          const totalPrice = parseFloat(pkg!.totalPrice as string);
          const remainingBalance = Math.max(0, totalPrice - enrollmentFeeAmt);
          packageName = pkg!.name;
          amountCharged = enrollmentFeeAmt;
          const deferDate = input.deferredTuitionDate
            ? new Date(input.deferredTuitionDate + 'T12:00:00')
            : null;
          const insertResult = await db.insert(schema.enrollments).values({
            membershipPackageId: pkg!.id,
            leadId: input.leadId || null,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            studentName: input.studentName || input.customerName,
            fluidpayCustomerId: fpCustomerId,
            fluidpaySubscriptionId: fpSubscriptionId,
            stripePaymentIntentId: fpTransactionId,
            downPaymentAmount: enrollmentFeeAmt.toFixed(2),
            paidFirstMonth: 0, // first month NOT yet paid
            deferredTuitionDate: deferDate,
            deferredTuitionAmount: monthlyPrice.toFixed(2),
            deferredTuitionCharged: 0, // pending
            remainingBalance: remainingBalance.toFixed(2),
            monthlyPaymentsRemaining: pkg!.durationMonths,
            status: 'active',
            discountApplied: input.discountCode || null,
            agreementSignature: input.agreementSignature || null,
            agreementSignedAt: input.agreementSignedAt ? new Date(input.agreementSignedAt) : null,
            startDate: new Date(),
          });
          enrollmentId = (insertResult as any).insertId;
        } else if (input.waiveDownPayment) {
          // Full down payment waived: $0 today, recurring starts immediately
          const totalPrice = parseFloat(pkg!.totalPrice as string);
          packageName = pkg!.name;
          amountCharged = 0;
          const insertResult = await db.insert(schema.enrollments).values({
            membershipPackageId: pkg!.id,
            leadId: input.leadId || null,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            studentName: input.studentName || input.customerName,
            fluidpayCustomerId: fpCustomerId,
            fluidpaySubscriptionId: fpSubscriptionId,
            stripePaymentIntentId: null,
            downPaymentAmount: '0.00',
            paidFirstMonth: 0,
            remainingBalance: totalPrice.toFixed(2),
            monthlyPaymentsRemaining: pkg!.durationMonths,
            status: 'active',
            discountApplied: 'down_payment_waived',
            agreementSignature: input.agreementSignature || null,
            agreementSignedAt: input.agreementSignedAt ? new Date(input.agreementSignedAt) : null,
            startDate: new Date(),
          });
          enrollmentId = (insertResult as any).insertId;
        } else {
          const downPayment = parseFloat(pkg!.downPayment as string);
          const enrollmentFeeAmt = parseFloat((pkg!.enrollmentFee ?? '99') as string);
          const effectiveDownPayment = input.waiveEnrollmentFee
            ? Math.max(0, downPayment - enrollmentFeeAmt)
            : downPayment;
          const totalPrice = parseFloat(pkg!.totalPrice as string);
          const remainingBalance = Math.max(0, totalPrice - effectiveDownPayment);
          packageName = pkg!.name;
          amountCharged = effectiveDownPayment;
          const discountNote = input.waiveEnrollmentFee
            ? `enrollment_fee_waived${input.waiverReason ? ':' + input.waiverReason : ''}`
            : (input.discountCode || null);
          const insertResult = await db.insert(schema.enrollments).values({
            membershipPackageId: pkg!.id,
            leadId: input.leadId || null,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            studentName: input.studentName || input.customerName,
            fluidpayCustomerId: fpCustomerId,
            fluidpaySubscriptionId: fpSubscriptionId,
            stripePaymentIntentId: fpTransactionId,
            downPaymentAmount: effectiveDownPayment.toFixed(2),
            paidFirstMonth: 1,
            remainingBalance: remainingBalance.toFixed(2),
            monthlyPaymentsRemaining: pkg!.durationMonths - 1,
            status: 'active',
            discountApplied: discountNote,
            agreementSignature: input.agreementSignature || null,
            agreementSignedAt: input.agreementSignedAt ? new Date(input.agreementSignedAt) : null,
            startDate: new Date(),
          });
          enrollmentId = (insertResult as any).insertId;
        }

        // Step 5: Send enrollment confirmation email (fire-and-forget, non-blocking)
        const nextBillingDate = (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 1);
          return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        })();
        sendEnrollmentConfirmationEmail({
          toEmail: input.customerEmail,
          customerName: input.customerName,
          studentName: input.studentName || input.customerName,
          packageName,
          monthlyPrice: pkg ? parseFloat(pkg.monthlyPrice as string) : null,
          // If fee was waived, show $0 in the breakdown so the email is accurate
          enrollmentFee: input.waiveEnrollmentFee ? 0 : (pkg ? parseFloat((pkg.enrollmentFee ?? '99') as string) : 99),
          totalDueToday: amountCharged,
          nextBillingDate: input.isSummerCamp ? null : nextBillingDate,
          isSummerCamp: input.isSummerCamp ?? false,
          summerCampWeek: input.summerCampWeek ?? null,
          transactionId: fpTransactionId ?? null,
          waiverReason: input.waiveEnrollmentFee ? (input.waiverReason || 'Enrollment fee waived') : undefined,
        }).catch(err => console.error('[Email] Enrollment confirmation fire-and-forget error:', err));
        // Step 6: Notify staff via SMS (fire-and-forget)
        import('./notifyStaffNewEnrollment').then(({ notifyStaffNewEnrollment }) => {
          notifyStaffNewEnrollment({
            studentName: input.studentName || input.customerName,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            packageName,
            amountCharged,
            program: pkg?.name ?? undefined,
          }).catch(() => {});
        }).catch(() => {});
        return {
          success: true,
          enrollmentId,
          transactionId: fpTransactionId,
          subscriptionId: fpSubscriptionId,
          packageName,
          amountCharged,
        };
      }),
    // ── Request to Cancel ────────────────────────────────────────────────────
    requestCancellation: protectedProcedure
      .input(z.object({
        enrollmentId: z.number(),
        reason: z.string().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Fetch the enrollment and verify ownership
        const [enrollment] = await db.select().from(schema.enrollments)
          .where(eq(schema.enrollments.id, input.enrollmentId));
        if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
        if (enrollment.customerEmail !== ctx.user.email && ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only cancel your own enrollment' });
        }
        if (enrollment.status === 'cancelled') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Enrollment is already cancelled' });
        }
        if (enrollment.cancellationRequestedAt) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cancellation has already been requested for this enrollment' });
        }

        // Calculate effective date: 30 days from now (one final billing cycle)
        const now = new Date();
        const effectiveDate = new Date(now);
        effectiveDate.setDate(effectiveDate.getDate() + 30);

        await db.update(schema.enrollments)
          .set({
            cancellationRequestedAt: now,
            cancellationEffectiveDate: effectiveDate,
            cancellationReason: input.reason || null,
            status: 'cancelled', // Mark as pending cancellation — final bill still runs
          })
          .where(eq(schema.enrollments.id, input.enrollmentId));

        // Notify owner
        import('./_core/notification').then(({ notifyOwner }) => {
          notifyOwner({
            title: 'Cancellation Request Received',
            content: `Member ${enrollment.customerName} (${enrollment.customerEmail}) has requested to cancel their membership.\nReason: ${input.reason || 'Not provided'}\nFinal billing date: ${effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
          }).catch(() => {});
        }).catch(() => {});

        // Send confirmation email to member
        import('./emailService').then(({ sendCancellationConfirmationEmail }) => {
          sendCancellationConfirmationEmail({
            toEmail: enrollment.customerEmail,
            customerName: enrollment.customerName,
            finalBillingDate: effectiveDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            reason: input.reason,
          }).catch(err => console.error('[Email] Cancellation confirmation error:', err));
        }).catch(() => {});

        return { success: true, effectiveDate };
      }),

    // ── Freeze Membership ─────────────────────────────────────────────────
    freezeMembership: protectedProcedure
      .input(z.object({
        enrollmentId: z.number(),
        freezeStartDate: z.string(), // ISO date string
        freezeEndDate: z.string(),   // ISO date string
        reason: z.string().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const [enrollment] = await db.select().from(schema.enrollments)
          .where(eq(schema.enrollments.id, input.enrollmentId));
        if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
        if (enrollment.customerEmail !== ctx.user.email && ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only freeze your own enrollment' });
        }
        if (enrollment.status !== 'active') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only active enrollments can be frozen' });
        }
        if (enrollment.isFrozen) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Membership is already frozen' });
        }

        const startDate = new Date(input.freezeStartDate);
        const endDate = new Date(input.freezeEndDate);
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

        if (durationDays < 28) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Minimum freeze duration is 1 month (28 days)' });
        }
        if (durationDays > 92) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Maximum freeze duration is 3 months (92 days)' });
        }

        await db.update(schema.enrollments)
          .set({
            isFrozen: 1,
            freezeStartDate: startDate,
            freezeEndDate: endDate,
            freezeReason: input.reason || null,
          })
          .where(eq(schema.enrollments.id, input.enrollmentId));

        // Notify owner
        import('./_core/notification').then(({ notifyOwner }) => {
          notifyOwner({
            title: 'Membership Freeze Request',
            content: `Member ${enrollment.customerName} (${enrollment.customerEmail}) has requested to freeze their membership.\nFreeze period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\nReason: ${input.reason || 'Not provided'}`,
          }).catch(() => {});
        }).catch(() => {});

        return { success: true, freezeStartDate: startDate, freezeEndDate: endDate };
      }),

    // ── Unfreeze Membership ───────────────────────────────────────────────
    unfreezeMembership: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const [enrollment] = await db.select().from(schema.enrollments)
          .where(eq(schema.enrollments.id, input.enrollmentId));
        if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
        if (enrollment.customerEmail !== ctx.user.email && ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only unfreeze your own enrollment' });
        }
        if (!enrollment.isFrozen) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Membership is not currently frozen' });
        }

        await db.update(schema.enrollments)
          .set({
            isFrozen: 0,
            freezeStartDate: null,
            freezeEndDate: null,
            freezeReason: null,
          })
          .where(eq(schema.enrollments.id, input.enrollmentId));

        return { success: true };
      }),

    // ── Belt Exam Payment ────────────────────────────────────────────────
    createBeltExamCheckout: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Find the active enrollment for this user
      const [enrollment] = await db
        .select({
          id: schema.enrollments.id,
          beltRank: schema.enrollments.beltRank,
          customerName: schema.enrollments.customerName,
          customerEmail: schema.enrollments.customerEmail,
          beltExamFeePaid: schema.enrollments.beltExamFeePaid,
          beltExamEligible: schema.enrollments.beltExamEligible,
          classesAtCurrentBelt: schema.enrollments.classesAtCurrentBelt,
        })
        .from(schema.enrollments)
        .where(eq(schema.enrollments.customerEmail, ctx.user.email))
        .limit(1);

      if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'No active enrollment found' });
      if (enrollment.beltExamFeePaid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Belt exam fee already paid' });

      const { BELT_EXAM_FEE } = await import('../shared/const.js');
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-01-28.clover' as any });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: enrollment.customerEmail,
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Belt Exam Fee — ${enrollment.beltRank ?? 'Current Belt'}`,
              description: 'MyDojo belt examination fee. Includes instructor evaluation and belt certificate.',
            },
            unit_amount: BELT_EXAM_FEE * 100,
          },
          quantity: 1,
        }],
        metadata: {
          type: 'belt_exam',
          enrollment_id: enrollment.id.toString(),
          student_name: enrollment.customerName,
          belt_rank: enrollment.beltRank ?? 'Unknown',
          user_id: ctx.user.id.toString(),
        },
        client_reference_id: ctx.user.id.toString(),
        success_url: `${ctx.req.headers.origin || ''}/member/dashboard?belt_exam=success`,
        cancel_url: `${ctx.req.headers.origin || ''}/member/dashboard?belt_exam=cancelled`,
      });

      // Mark as eligible (pending payment confirmation via webhook)
      await db.update(schema.enrollments)
        .set({ beltExamEligible: 1 })
        .where(eq(schema.enrollments.id, enrollment.id));

      return { checkoutUrl: session.url };
    }),

    // ── Get My Enrollment ────────────────────────────────────────────────
    getMyEnrollment: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const [enrollment] = await db
        .select({
          id: schema.enrollments.id,
          customerName: schema.enrollments.customerName,
          customerEmail: schema.enrollments.customerEmail,
          status: schema.enrollments.status,
          beltRank: schema.enrollments.beltRank,
          downPaymentAmount: schema.enrollments.downPaymentAmount,
          isFrozen: schema.enrollments.isFrozen,
          freezeStartDate: schema.enrollments.freezeStartDate,
          freezeEndDate: schema.enrollments.freezeEndDate,
          freezeReason: schema.enrollments.freezeReason,
          cancellationRequestedAt: schema.enrollments.cancellationRequestedAt,
          cancellationEffectiveDate: schema.enrollments.cancellationEffectiveDate,
          cancellationReason: schema.enrollments.cancellationReason,
          createdAt: schema.enrollments.createdAt,
          packageName: schema.membershipPackages.name,
          packageMonthlyPrice: schema.membershipPackages.monthlyPrice,
        })
        .from(schema.enrollments)
        .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
        .where(eq(schema.enrollments.customerEmail, ctx.user.email))
        .orderBy(schema.enrollments.createdAt)
        .limit(1);

      return enrollment || null;
    }),
    // Upload the logged-in member's own profile photo
    uploadSelfPhoto: protectedProcedure
      .input(z.object({
        imageBase64: z.string(),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const buffer = Buffer.from(input.imageBase64, 'base64');
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Image must be under 5 MB' });
        }
        const ext = input.mimeType.split('/')[1];
        const randomSuffix = Math.random().toString(36).slice(2, 10);
        const fileKey = `member-photos/${ctx.user.id}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        // Find the member's active enrollment by email and update photoUrl
        const enrollment = await db
          .select({ id: schema.enrollments.id })
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.customerEmail, ctx.user.email),
              eq(schema.enrollments.status, 'active')
            )
          )
          .limit(1);
        if (enrollment.length > 0) {
          await db
            .update(schema.enrollments)
            .set({ photoUrl: url })
            .where(eq(schema.enrollments.id, enrollment[0].id));
        }
        return { url };
      }),
  }),
  curriculum: router({
    // Get curriculum content accessible to user based on their belt rank
    getAccessibleContent: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      // Get user's enrollment and belt rank
      const result = await getMemberEnrollment(ctx.user.email);
      if (!result) {
        return { beltRank: "No Belt", content: [] };
      }

      const beltRank = result.enrollment.beltRank || "No Belt";
      
      // Define belt hierarchy
      const beltHierarchy = [
        "No Belt", "White Belt", "Yellow Belt", "Orange Belt", "Green Belt",
        "Advanced Green", "Blue Belt", "Advanced Blue", "Purple Belt", "Advanced Purple",
        "Brown Belt", "Advanced Brown", "Probationary Black", "Black Belt 1st Dan"
      ];
      
      const currentBeltIndex = beltHierarchy.indexOf(beltRank);
      const accessibleBelts = beltHierarchy.slice(0, currentBeltIndex + 1);
      
      // Get all curriculum content up to current belt
      const content = await db
        .select()
        .from(schema.curriculumContent)
        .where(eq(schema.curriculumContent.isPublished, 1))
        .orderBy(schema.curriculumContent.sortOrder);
      
      // Filter content by accessible belts
      const accessibleContent = content.filter((item: any) => 
        accessibleBelts.includes(item.beltRank)
      );
      
      return {
        beltRank,
        beltAchievedDate: result.enrollment.beltAchievedDate,
        content: accessibleContent
      };
    }),

    // Get progress for current user
    getMyProgress: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const result = await getMemberEnrollment(ctx.user.email);
      if (!result) {
        return [];
      }

      const progress = await db
        .select()
        .from(schema.studentProgress)
        .where(eq(schema.studentProgress.enrollmentId, result.enrollment.id));
      
      return progress;
    }),

    // Mark curriculum item as completed
    markCompleted: protectedProcedure
      .input(z.object({
        curriculumContentId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const result = await getMemberEnrollment(ctx.user.email);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Enrollment not found"
          });
        }

        // Check if progress record exists
        const existing = await db
          .select()
          .from(schema.studentProgress)
          .where(
            and(
              eq(schema.studentProgress.enrollmentId, result.enrollment.id),
              eq(schema.studentProgress.curriculumContentId, input.curriculumContentId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing
          await db
            .update(schema.studentProgress)
            .set({
              status: "completed",
              completedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(schema.studentProgress.id, existing[0].id));
        } else {
          // Insert new
          await db.insert(schema.studentProgress).values({
            enrollmentId: result.enrollment.id,
            curriculumContentId: input.curriculumContentId,
            status: "completed",
            completedAt: new Date()
          });
        }

        return { success: true };
      }),

    // Add or update instructor feedback (instructor only)
    addInstructorFeedback: protectedProcedure
      .input(z.object({
        studentProgressId: z.number(),
        feedback: z.string().min(1)
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Check if user is an instructor (admin or staff role)
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only instructors can leave feedback"
          });
        }

        // Update the progress record with instructor feedback
        await db
          .update(schema.studentProgress)
          .set({
            instructorFeedback: input.feedback,
            instructorId: ctx.user.id,
            feedbackDate: new Date(),
            updatedAt: new Date()
          })
          .where(eq(schema.studentProgress.id, input.studentProgressId));

        return { success: true };
      }),

    // Get all student progress for instructor view (instructor only)
    getStudentProgress: protectedProcedure
      .input(z.object({
        enrollmentId: z.number()
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Check if user is an instructor (admin or staff role)
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only instructors can view student progress"
          });
        }

        // Get all progress records for this enrollment with curriculum details
        const progress = await db
          .select({
            id: schema.studentProgress.id,
            curriculumContentId: schema.studentProgress.curriculumContentId,
            status: schema.studentProgress.status,
            completedAt: schema.studentProgress.completedAt,
            instructorFeedback: schema.studentProgress.instructorFeedback,
            instructorId: schema.studentProgress.instructorId,
            feedbackDate: schema.studentProgress.feedbackDate,
            curriculumTitle: schema.curriculumContent.title,
            curriculumCategory: schema.curriculumContent.category,
            beltRank: schema.curriculumContent.beltRank
          })
          .from(schema.studentProgress)
          .leftJoin(
            schema.curriculumContent,
            eq(schema.studentProgress.curriculumContentId, schema.curriculumContent.id)
          )
          .where(eq(schema.studentProgress.enrollmentId, input.enrollmentId));
        
        return progress;
      }),
  }),

  attendance: router({
    // Student check-in for class
    checkIn: protectedProcedure
      .input(z.object({
        classScheduleId: z.number(),
        attendanceDate: z.string(), // YYYY-MM-DD format
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Get user's enrollment
        const result = await getMemberEnrollment(ctx.user.email);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active enrollment found"
          });
        }

        // Check if already checked in for this class today
        const existing = await db
          .select()
          .from(schema.classAttendance)
          .where(
            and(
              eq(schema.classAttendance.enrollmentId, result.enrollment.id),
              eq(schema.classAttendance.classScheduleId, input.classScheduleId),
              eq(schema.classAttendance.attendanceDate, input.attendanceDate)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already checked in for this class today"
          });
        }

        // Create attendance record
        const attendance = await db.insert(schema.classAttendance).values({
          enrollmentId: result.enrollment.id,
          userId: ctx.user.id,
          classScheduleId: input.classScheduleId,
          attendanceDate: input.attendanceDate,
          checkInTime: new Date(),
          checkInMethod: "manual",
          status: "present"
        });

        return { success: true };
      }),

    // Get attendance history for current user
    getMyAttendance: protectedProcedure
      .input(z.object({
        limit: z.number().optional().default(50)
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        const result = await getMemberEnrollment(ctx.user.email);
        if (!result) {
          return [];
        }

        // Get attendance records with class details
        const attendance = await db
          .select({
            id: schema.classAttendance.id,
            attendanceDate: schema.classAttendance.attendanceDate,
            checkInTime: schema.classAttendance.checkInTime,
            checkOutTime: schema.classAttendance.checkOutTime,
            status: schema.classAttendance.status,
            notes: schema.classAttendance.notes,
            program: schema.classSchedule.program,
            dayOfWeek: schema.classSchedule.dayOfWeek,
            startTime: schema.classSchedule.startTime,
            endTime: schema.classSchedule.endTime,
            instructor: schema.classSchedule.instructor
          })
          .from(schema.classAttendance)
          .leftJoin(
            schema.classSchedule,
            eq(schema.classAttendance.classScheduleId, schema.classSchedule.id)
          )
          .where(eq(schema.classAttendance.enrollmentId, result.enrollment.id))
          .orderBy(schema.classAttendance.attendanceDate)
          .limit(input.limit);
        
        return attendance;
      }),

    // Get today's available classes for check-in
    getTodayClasses: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      
      const result = await getMemberEnrollment(ctx.user.email);
      if (!result) {
        return [];
      }

      // Get today's day of week
      const today = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = dayNames[today.getDay()];
      const todayDate = today.toISOString().split('T')[0];

      // Get all classes for today
      const classes = await db
        .select()
        .from(schema.classSchedule)
        .where(
          and(
            eq(schema.classSchedule.dayOfWeek, todayName as any),
            eq(schema.classSchedule.isActive, 1)
          )
        );

      // Check which classes user has already checked in for
      const checkedIn = await db
        .select()
        .from(schema.classAttendance)
        .where(
          and(
            eq(schema.classAttendance.enrollmentId, result.enrollment.id),
            eq(schema.classAttendance.attendanceDate, todayDate)
          )
        );

      const checkedInIds = new Set(checkedIn.map(a => a.classScheduleId));

      return classes.map(c => ({
        ...c,
        isCheckedIn: checkedInIds.has(c.id)
      }));
    }),

    // Admin: Get all attendance for a specific date
    getAttendanceByDate: protectedProcedure
      .input(z.object({
        date: z.string() // YYYY-MM-DD
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required"
          });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const attendance = await db
          .select({
            id: schema.classAttendance.id,
            checkInTime: schema.classAttendance.checkInTime,
            checkOutTime: schema.classAttendance.checkOutTime,
            status: schema.classAttendance.status,
            studentName: schema.enrollments.customerName,
            program: schema.classSchedule.program,
            startTime: schema.classSchedule.startTime,
            endTime: schema.classSchedule.endTime
          })
          .from(schema.classAttendance)
          .leftJoin(
            schema.enrollments,
            eq(schema.classAttendance.enrollmentId, schema.enrollments.id)
          )
          .leftJoin(
            schema.classSchedule,
            eq(schema.classAttendance.classScheduleId, schema.classSchedule.id)
          )
          .where(eq(schema.classAttendance.attendanceDate, input.date));

        return attendance;
      }),

    // Generate QR code for a class
    generateClassQR: protectedProcedure
      .input(z.object({
        classScheduleId: z.number(),
        date: z.string() // YYYY-MM-DD
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "staff") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required"
          });
        }

        // Create QR code data with class info and date
        const qrData = JSON.stringify({
          classScheduleId: input.classScheduleId,
          date: input.date,
          timestamp: Date.now()
        });

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        return { qrCode: qrCodeDataUrl, data: qrData };
      }),

    // Check in via QR code scan
    checkInViaQR: protectedProcedure
      .input(z.object({
        qrData: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        
        // Parse QR code data
        let qrInfo;
        try {
          qrInfo = JSON.parse(input.qrData);
        } catch (e) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid QR code"
          });
        }

        const { classScheduleId, date } = qrInfo;

        // Get user's enrollment
        const result = await getMemberEnrollment(ctx.user.email);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active enrollment found"
          });
        }

        // Check if already checked in
        const existing = await db
          .select()
          .from(schema.classAttendance)
          .where(
            and(
              eq(schema.classAttendance.enrollmentId, result.enrollment.id),
              eq(schema.classAttendance.classScheduleId, classScheduleId),
              eq(schema.classAttendance.attendanceDate, date)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already checked in for this class"
          });
        }

        // Create attendance record
        await db.insert(schema.classAttendance).values({
          enrollmentId: result.enrollment.id,
          userId: ctx.user.id,
          classScheduleId,
          attendanceDate: date,
          checkInTime: new Date(),
          checkInMethod: "qr_code",
          status: "present"
        });

        // Get class details for response
        const classDetails = await db
          .select()
          .from(schema.classSchedule)
          .where(eq(schema.classSchedule.id, classScheduleId))
          .limit(1);

         return { 
          success: true, 
          className: classDetails[0]?.program || "Class",
          classTime: classDetails[0]?.startTime || ""
        };
      }),
  }),
  // Kiosk check-in system with gamification
  kiosk: router({
    // Get perfect attendance leaderboard (top current streaks)
    getPerfectAttendance: publicProcedure.query(async () => {
      const { getPerfectAttendanceLeaderboard } = await import("./db");
      const leaderboard = await getPerfectAttendanceLeaderboard(10);
      return leaderboard;
    }),

    // Get students close to next belt promotion (15+ classes at current belt)
    getRunnerUpForNextBelt: publicProcedure.query(async () => {
      const { getRunnerUpForNextBelt } = await import("./db");
      const runners = await getRunnerUpForNextBelt(10);
      return runners;
    }),

    // Record check-in for a student
    checkIn: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
        studentId: z.number().optional(), // optional — defaults to enrollmentId for kiosk check-ins
        classId: z.number().optional(),
        programType: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { recordCheckIn } = await import("./db");
        
        const result = await recordCheckIn({
          studentId: input.studentId ?? input.enrollmentId, // use enrollmentId as studentId when no separate student record
          enrollmentId: input.enrollmentId,
          classId: input.classId,
          locationId: "Tomball HQ",
          programType: input.programType,
          source: "kiosk",
          notes: input.notes,
        });

        if (!result) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: 'Failed to record check-in' 
          });
        }

        return result;
      }),

    // Get today's class schedule for kiosk display
    getTodayClassSchedule: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Get today's day of week
      const today = new Date();
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const todayName = dayNames[today.getDay()];

      // Get all active classes for today
      const classes = await db
        .select()
        .from(schema.classSchedule)
        .where(
          and(
            eq(schema.classSchedule.dayOfWeek, todayName as any),
            eq(schema.classSchedule.isActive, 1)
          )
        )
        .orderBy(schema.classSchedule.startTime);

      return classes;
    }),

    // Get today's intro lesson appointments
    getTodayIntroAppointments: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

      // Get scheduled intro appointments for today
      const appointments = await db
        .select()
        .from(schema.trialSignups)
        .where(
          and(
            eq(schema.trialSignups.status, "scheduled"),
            // Filter for today's appointments
          )
        )
        .orderBy(schema.trialSignups.scheduledTime);

      // Filter for today (client-side since we need timestamp comparison)
      const todayAppointments = appointments.filter(apt => {
        if (!apt.scheduledTime) return false;
        const aptTime = new Date(apt.scheduledTime);
        return aptTime >= todayStart && aptTime <= todayEnd;
      });

      return todayAppointments;
    }),

    // Get students with birthdays this week
    getBirthdayStudents: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const today = new Date();
      const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
      const currentDay = today.getDate();
      
      // Get students with birthdays within 7 days
      const students = await db
        .select({
          id: schema.enrollments.id,
          name: schema.enrollments.customerName,
          photoUrl: schema.enrollments.photoUrl,
          dateOfBirth: schema.enrollments.dateOfBirth,
        })
        .from(schema.enrollments)
        .where(eq(schema.enrollments.status, "active"));

      // Filter for birthdays this week (client-side for simplicity)
      const birthdayStudents = students.filter(student => {
        if (!student.dateOfBirth) return false;
        const [, month, day] = student.dateOfBirth.split('-');
        const birthMonth = parseInt(month);
        const birthDay = parseInt(day);
        
        // Check if birthday is this week
        if (birthMonth === parseInt(currentMonth)) {
          const dayDiff = birthDay - currentDay;
          return dayDiff >= 0 && dayDiff <= 7;
        }
        return false;
      });

      return birthdayStudents;
    }),

    // Search student by phone number
     searchByPhone: publicProcedure
      .input(z.object({ phone: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Normalize phone: strip all non-digits for flexible matching
        const digits = input.phone.replace(/\D/g, '');
        // Search all active enrollments (no Stripe requirement — staff-enrolled students have no stripeCustomerId)
        const allActive = await db
          .select()
          .from(schema.enrollments)
          .where(eq(schema.enrollments.status, "active"))
          .limit(100);
        // Match against customerPhone (digits only)
        const match = allActive.find(e => {
          const eDigits = (e.customerPhone || '').replace(/\D/g, '');
          return eDigits === digits || eDigits.endsWith(digits) || digits.endsWith(eDigits);
        });
        if (!match) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No active enrollment found for this phone number"
          });
        }
        return match;
      }),

      // Search student by name
    searchByName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const q = input.name.toLowerCase().trim();

        // Fetch all active enrollments
        const enrollments = await db
          .select()
          .from(schema.enrollments)
          .where(eq(schema.enrollments.status, "active"))
          .limit(200);
        const filteredEnrollments = enrollments
          .filter(e => {
            const studentMatch = e.studentName && e.studentName.toLowerCase().includes(q);
            const customerMatch = e.customerName && e.customerName.toLowerCase().includes(q);
            return studentMatch || customerMatch;
          })
          .map(e => ({ ...e, _type: 'student' as const }));

        // Also search leads (trialSignups) that are not yet enrolled
        const leads = await db
          .select()
          .from(schema.trialSignups)
          .where(
            and(
              like(schema.trialSignups.name, `%${input.name}%`),
              ne(schema.trialSignups.pipelineStage, 'enrolled')
            )
          )
          .limit(50);
        const filteredLeads = leads.map(l => ({
          id: l.id,
          studentName: l.name,
          customerName: l.name,
          beltRank: 'No Belt' as const,
          photoUrl: null,
          programType: l.program,
          _type: 'lead' as const,
          leadId: l.id,
        }));

        return [...filteredEnrollments, ...filteredLeads];
      }),

    // Intro student check-in (for trial/intro appointments)
    introCheckIn: publicProcedure
      .input(
        z.object({
          trialSignupId: z.number(),
          classScheduleId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const { trialSignupId, classScheduleId } = input;
        const today = new Date().toISOString().split('T')[0];

        // Get trial signup details
        const trialSignup = await db
          .select()
          .from(schema.trialSignups)
          .where(eq(schema.trialSignups.id, trialSignupId))
          .limit(1);

        if (!trialSignup[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Intro appointment not found"
          });
        }

        // Update intro count completed
        const newIntroCount = (trialSignup[0].introCountCompleted || 0) + 1;
        await db
          .update(schema.trialSignups)
          .set({
            introCountCompleted: newIntroCount,
            status: newIntroCount >= (trialSignup[0].introCountRequired || 0) ? "completed" : "scheduled",
          })
          .where(eq(schema.trialSignups.id, trialSignupId));

        // Get class details
        const classDetails = await db
          .select()
          .from(schema.classSchedule)
          .where(eq(schema.classSchedule.id, classScheduleId))
          .limit(1);

        return {
          success: true,
          studentName: trialSignup[0].name,
          className: classDetails[0]?.program || "Intro Class",
          introProgress: `${newIntroCount}/${trialSignup[0].introCountRequired || 0}`,
          isComplete: newIntroCount >= (trialSignup[0].introCountRequired || 0),
        };
      }),

    // Kiosk check-in with gamification
    kioskCheckIn: publicProcedure
      .input(
        z.object({
          enrollmentId: z.number(),
          classScheduleId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const { enrollmentId, classScheduleId } = input;
        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in
        const existing = await db
          .select()
          .from(schema.classAttendance)
          .where(
            and(
              eq(schema.classAttendance.enrollmentId, enrollmentId),
              eq(schema.classAttendance.classScheduleId, classScheduleId),
              eq(schema.classAttendance.attendanceDate, today)
            )
          )
          .limit(1);

        if (existing[0]) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already checked in for this class today"
          });
        }

        // Get enrollment for streak calculation
        const enrollment = await db
          .select()
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, enrollmentId))
          .limit(1);

        if (!enrollment[0]) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Enrollment not found"
          });
        }

        // Calculate streak
        let newStreak = 1;
        const lastCheckIn = enrollment[0].lastCheckInDate;
        if (lastCheckIn) {
          const lastDate = new Date(lastCheckIn);
          const todayDate = new Date(today);
          const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            // Consecutive day
            newStreak = (enrollment[0].currentStreak || 0) + 1;
          } else if (daysDiff === 0) {
            // Same day (shouldn't happen due to check above)
            newStreak = enrollment[0].currentStreak || 1;
          } else {
            // Streak broken
            newStreak = 1;
          }
        }

        // Calculate XP earned
        const xpEarned = 10;
        const newTotalXP = (enrollment[0].totalXP || 0) + xpEarned;
        const longestStreak = Math.max(newStreak, enrollment[0].longestStreak || 0);

        // Check if birthday today
        const isBirthday = enrollment[0].dateOfBirth && 
          enrollment[0].dateOfBirth.slice(5) === today.slice(5);
        const birthdayBonus = isBirthday ? xpEarned : 0; // Double XP on birthday

        // Create attendance record
        await db.insert(schema.classAttendance).values({
          enrollmentId,
          userId: enrollment[0].id, // Using enrollment ID as user ID for now
          classScheduleId,
          attendanceDate: today,
          checkInTime: new Date(),
          checkInMethod: "manual",
          status: "present"
        });

        // Update enrollment with new streak and XP
        await db
          .update(schema.enrollments)
          .set({
            currentStreak: newStreak,
            longestStreak,
            lastCheckInDate: today,
            totalXP: newTotalXP + birthdayBonus,
          })
          .where(eq(schema.enrollments.id, enrollmentId));

        // Get class details
        const classDetails = await db
          .select()
          .from(schema.classSchedule)
          .where(eq(schema.classSchedule.id, classScheduleId))
          .limit(1);

        // ── Belt-Ready & Exam-Eligibility Notifications ──────────────────────
        // Fire-and-forget: check if this check-in just crossed the belt threshold
        (async () => {
          try {
            const {
              classesRequiredForNextBelt,
              isInClassBelt,
              nextBeltRank,
              requiresBeltExam,
              BELT_EXAM_FEE,
            } = await import('../shared/const.js');
            const currentBelt = enrollment[0].beltRank ?? 'No Belt';
            const nextBelt = nextBeltRank(currentBelt);
            if (!nextBelt) return;

            // Count classes at current belt from classAttendance
            const countRows = await db
              .select({ count: sql`COUNT(*)` })
              .from(schema.classAttendance)
              .where(eq(schema.classAttendance.enrollmentId, enrollmentId));
            const totalClasses = Number((countRows[0] as any).count ?? 0);
            const required = classesRequiredForNextBelt(currentBelt);

            // Only act on the exact crossing class
            if (totalClasses !== required) return;

            const email = enrollment[0].customerEmail;
            const name = enrollment[0].studentName || enrollment[0].customerName || 'Student';

            if (isInClassBelt(currentBelt)) {
              // ── In-class belt: notify instructor will award belt next class ──
              const { sendBeltReadyEmail } = await import('./emailService.js');
              if (email) {
                await sendBeltReadyEmail({ to: email, studentName: name, currentBelt, nextBelt });
              }
            } else if (requiresBeltExam(currentBelt)) {
              // ── Exam belt: check if already notified to avoid duplicate emails ──
              const alreadyEligible = (enrollment[0].beltExamEligible ?? 0) === 1;
              if (alreadyEligible) return;

              // Generate a Stripe checkout URL for the exam fee
              const Stripe = (await import('stripe')).default;
              const stripe = new Stripe(
                process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '',
                { apiVersion: '2026-01-28.clover' as any }
              );
              const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                mode: 'payment',
                customer_email: email ?? undefined,
                line_items: [{
                  price_data: {
                    currency: 'usd',
                    product_data: {
                      name: `Belt Exam Fee — ${currentBelt} → ${nextBelt}`,
                      description: 'MyDojo belt examination fee. Includes instructor evaluation and belt certificate.',
                    },
                    unit_amount: BELT_EXAM_FEE * 100,
                  },
                  quantity: 1,
                }],
                metadata: {
                  type: 'belt_exam',
                  enrollment_id: enrollmentId.toString(),
                  student_name: name,
                  belt_rank: currentBelt,
                },
                client_reference_id: enrollmentId.toString(),
                success_url: 'https://www.mydojoma.com/member/dashboard?belt_exam=success',
                cancel_url: 'https://www.mydojoma.com/member/dashboard?belt_exam=cancelled',
                allow_promotion_codes: true,
              });

              if (!session.url) return;

              // Mark as eligible so we don't send again
              await db
                .update(schema.enrollments)
                .set({ beltExamEligible: 1 })
                .where(eq(schema.enrollments.id, enrollmentId));

              // Send the exam eligibility email with the payment link
              const { sendBeltExamEligibleEmail } = await import('./emailService.js');
              if (email) {
                await sendBeltExamEligibleEmail({
                  to: email,
                  studentName: name,
                  currentBelt,
                  examBelt: nextBelt,
                  examFeeDollars: BELT_EXAM_FEE,
                  checkoutUrl: session.url,
                });
              }

              console.log(`[BeltExam] Eligibility email sent to ${email} for ${currentBelt} → ${nextBelt}`);
            }
          } catch (e) {
            console.error('[BeltReady] Notification error:', e);
          }
        })();

        return {
          success: true,
          xpEarned: xpEarned + birthdayBonus,
          newStreak,
          longestStreak,
          isBirthday,
          className: classDetails[0]?.program || "Class",
          beltProgress: 75, // TODO: Calculate based on attendance/curriculum
        };
      }),
    // Get today's scheduled classes for the class selector on the confirmation screen
    getTodaysClasses: publicProcedure
      .input(z.object({ location: z.string().optional() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
        const todayName = days[new Date().getDay()];
        const conditions: ReturnType<typeof eq>[] = [
          eq(schema.classSchedule.dayOfWeek, todayName),
          eq(schema.classSchedule.isActive, 1),
        ];
        if (input.location) {
          conditions.push(eq(schema.classSchedule.location, input.location));
        }
        const classes = await db
          .select()
          .from(schema.classSchedule)
          .where(and(...conditions))
          .orderBy(schema.classSchedule.startTime);
        return classes;
      }),

    // ─── Day Pass Procedures ──────────────────────────────────────────────────
    // Get day pass configuration (price)
    getDayPassConfig: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { amountCents: 2000, enabled: true };
      try {
        const rows = await db
          .select()
          .from(schema.adminConfig)
          .where(eq(schema.adminConfig.key, 'dayPassAmountCents'));
        const amountCents = rows[0] ? parseInt(rows[0].value) : 2000;
        return { amountCents, enabled: true };
      } catch {
        return { amountCents: 2000, enabled: true };
      }
    }),

    // Confirm day pass after Fluid Pay token received — charges card and records attendance
    confirmDayPassCheckIn: publicProcedure
      .input(z.object({
        token: z.string(),          // Fluid Pay Tokenizer token (valid 2 min)
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        program: z.string().min(1),
        classId: z.number().optional(),
        programType: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Get price from config
        let amountCents = 2000; // default $20
        try {
          const rows = await db.select().from(schema.adminConfig).where(eq(schema.adminConfig.key, 'dayPassAmountCents'));
          if (rows[0]) amountCents = parseInt(rows[0].value);
        } catch {}

        // Charge via Fluid Pay REST API
        const fluidPayKey = process.env.FLUIDPAY_SECRET_KEY;
        if (!fluidPayKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment processor not configured' });

        const chargeRes = await fetch('https://app.fluidpay.com/api/transaction', {
          method: 'POST',
          headers: { 'Authorization': fluidPayKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sale',
            amount: amountCents,
            payment_method: { token: input.token },
            billing_address: { first_name: input.name.split(' ')[0], last_name: input.name.split(' ').slice(1).join(' ') || '' },
            order_id: `daypass-${Date.now()}`,
            description: `MyDojo Day Pass – ${input.program}`,
          }),
        });

        const chargeBody = await chargeRes.json() as { status: string; msg: string; data?: { id: string; status: string; response_code: string; response_body?: { card?: { response_text?: string } } } };

        if (chargeBody.status !== 'success' || !chargeBody.data) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: chargeBody.msg || 'Payment failed' });
        }

        const txn = chargeBody.data;
        if (txn.status !== 'approved') {
          const declineMsg = txn.response_body?.card?.response_text || `Transaction ${txn.status}`;
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Payment declined: ${declineMsg}` });
        }

        // Record the day pass
        await db.insert(schema.dayPasses).values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          program: input.program,
          amountCents,
          paymentTransactionId: txn.id,
          classId: input.classId,
          status: 'paid',
        } as any);

        // Record attendance for the day pass guest
        const today = new Date();
        const checkInDate = today.toISOString().split('T')[0];

        await db.insert(schema.attendance).values({
          studentId: 0,
          checkInDate,
          checkInTimestamp: today,
          beltRankAtCheckIn: 'Guest',
          programType: input.programType || input.program,
          source: 'kiosk',
          xpAwarded: 0,
          notes: `Day pass: ${input.name} (${input.email}) — txn ${txn.id}`,
        } as any);

        return {
          success: true,
          name: input.name,
          program: input.program,
          amountCents,
          transactionId: txn.id,
        };
      }),

    // ── Intro Offer Checkout (FluidPay) ──────────────────────────────────────
    // Packages: starter ($29/3 classes) | explorer ($49/5 classes)
    purchaseIntroOffer: publicProcedure
      .input(z.object({
        token: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        packageId: z.enum(['starter', 'explorer']),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const PACKAGES = {
          starter:  { amountCents: 2900, classesIncluded: 3,  label: 'Intro Offer – 3 Classes' },
          explorer: { amountCents: 4900, classesIncluded: 5,  label: 'Intro Offer – 5 Classes' },
        };
        const pkg = PACKAGES[input.packageId];

        const fluidPayKey = process.env.FLUIDPAY_SECRET_KEY;
        if (!fluidPayKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment processor not configured' });

        // Charge via FluidPay REST API
        const chargeRes = await fetch('https://app.fluidpay.com/api/transaction', {
          method: 'POST',
          headers: { 'Authorization': fluidPayKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sale',
            amount: pkg.amountCents,
            payment_method: { token: input.token },
            billing_address: {
              first_name: input.name.split(' ')[0],
              last_name: input.name.split(' ').slice(1).join(' ') || '',
              email: input.email,
            },
            order_id: `intro-${input.packageId}-${Date.now()}`,
            description: `MyDojo ${pkg.label}`,
          }),
        });

        const chargeBody = await chargeRes.json() as {
          status: string;
          msg: string;
          data?: { id: string; status: string; response_body?: { card?: { response_text?: string } } };
        };

        if (chargeBody.status !== 'success' || !chargeBody.data) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: chargeBody.msg || 'Payment failed' });
        }
        const txn = chargeBody.data;
        if (txn.status !== 'approved') {
          const declineMsg = txn.response_body?.card?.response_text || `Transaction ${txn.status}`;
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Payment declined: ${declineMsg}` });
        }

        // Record the purchase
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to use classes

        await db.insert(schema.introOfferPurchases).values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          packageId: input.packageId,
          amountCents: pkg.amountCents,
          classesIncluded: pkg.classesIncluded,
          classesRemaining: pkg.classesIncluded,
          fpTransactionId: txn.id,
          status: 'paid',
          expiresAt,
        } as any);

        // Notify owner
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `New Intro Offer Purchase – ${pkg.label}`,
            content: `${input.name} (${input.email}) purchased the ${pkg.label} for $${(pkg.amountCents / 100).toFixed(2)}. Transaction ID: ${txn.id}`,
          });
        } catch {}

        return {
          success: true,
          name: input.name,
          packageId: input.packageId,
          classesIncluded: pkg.classesIncluded,
          amountCents: pkg.amountCents,
          transactionId: txn.id,
          expiresAt,
        };
      }),
  }),
  // Admin router for management dashboard
  admin: router({    // Get all intro appointments
    getAllIntroAppointments: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const appointments = await db
        .select()
        .from(schema.trialSignups)
        .orderBy(desc(schema.trialSignups.createdAt));

      return appointments;
    }),

    // Create new intro appointment
    createIntroAppointment: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          phone: z.string().optional(),
          email: z.string().optional(),
          program: z.string(),
          scheduledTime: z.string(),
          location: z.string(),
          introCountRequired: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        await db.insert(schema.trialSignups).values({
          name: input.name,
          phone: input.phone || "",
          email: input.email || "",
          program: input.program as "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Not Sure",
          location: input.location,
          status: "scheduled",
          scheduledTime: new Date(input.scheduledTime),
          introCountRequired: input.introCountRequired,
          introCountCompleted: 0,
        });

        // Notify staff via SMS (fire-and-forget)
        const { notifyStaffNewLead } = await import('./notifyStaffNewLead');
        notifyStaffNewLead({ name: input.name, phone: input.phone, program: input.program, source: 'Manual' }).catch(() => {});

        return { success: true };
      }),

    // Update intro appointment
    updateIntroAppointment: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string(),
          phone: z.string().optional(),
          email: z.string().optional(),
          program: z.string(),
          scheduledTime: z.string(),
          location: z.string(),
          introCountRequired: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        await db
          .update(schema.trialSignups)
          .set({
            name: input.name,
            phone: input.phone || "",
            email: input.email || "",
            program: input.program as "Little Ninjas" | "Dragon Kids" | "Teens" | "Adult Karate" | "Kickboxing" | "After School" | "Not Sure",
            location: input.location,
            scheduledTime: new Date(input.scheduledTime),
            introCountRequired: input.introCountRequired,
          })
          .where(eq(schema.trialSignups.id, input.id));

        return { success: true };
      }),

    // ─── PIN Management ───────────────────────────────────────────────────────

    /** Set or update the 6-digit delete PIN (admin only) */
    setDeletePin: protectedProcedure
      .input(z.object({ pin: z.string().length(6).regex(/^\d{6}$/, 'PIN must be exactly 6 digits') }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Store PIN as plain text (6-digit numeric PIN — not a password, just a quick gate)
        await db
          .insert(schema.adminConfig)
          .values({ key: 'delete_pin', value: input.pin })
          .onDuplicateKeyUpdate({ set: { value: input.pin } });
        return { success: true };
      }),

    /** Check whether a delete PIN has been configured */
    getDeletePinStatus: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const [row] = await db
          .select()
          .from(schema.adminConfig)
          .where(eq(schema.adminConfig.key, 'delete_pin'))
          .limit(1);
        return { configured: !!row };
      }),

    /** Verify the 6-digit delete PIN — returns true if correct, throws if wrong */
    verifyDeletePin: protectedProcedure
      .input(z.object({ pin: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const [row] = await db
          .select()
          .from(schema.adminConfig)
          .where(eq(schema.adminConfig.key, 'delete_pin'))
          .limit(1);
        if (!row) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No delete PIN configured. Please set one in Admin Settings.' });
        if (row.value !== input.pin) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect PIN. Please try again.' });
        return { verified: true };
      }),

    // ─── Audit Log ────────────────────────────────────────────────────────────

    /** Get deletion audit log (admin only) */
    getDeletionAuditLog: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin/staff only' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const rows = await db
          .select()
          .from(schema.deletionAuditLog)
          .orderBy(desc(schema.deletionAuditLog.createdAt))
          .limit(input.limit)
          .offset(input.offset);
        const [{ total }] = await db
          .select({ total: sql<number>`COUNT(*)` })
          .from(schema.deletionAuditLog);
        return { rows, total: Number(total) };
      }),

    // ─── Delete with PIN + Audit ──────────────────────────────────────────────

    // Delete intro appointment (requires PIN)
    deleteIntroAppointment: protectedProcedure
      .input(z.object({ id: z.number(), pin: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Verify PIN
        const [pinRow] = await db
          .select()
          .from(schema.adminConfig)
          .where(eq(schema.adminConfig.key, 'delete_pin'))
          .limit(1);
        if (!pinRow) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No delete PIN configured. Please set one in Admin Settings.' });
        if (pinRow.value !== input.pin) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect PIN. Please try again.' });

        // Fetch lead name before deleting
        const [lead] = await db
          .select({ id: schema.trialSignups.id, name: schema.trialSignups.name })
          .from(schema.trialSignups)
          .where(eq(schema.trialSignups.id, input.id))
          .limit(1);

        await db
          .delete(schema.trialSignups)
          .where(eq(schema.trialSignups.id, input.id));

        // Write audit log
        await db.insert(schema.deletionAuditLog).values({
          targetType: 'lead',
          targetId: input.id,
          targetName: lead?.name ?? `Lead #${input.id}`,
          performedBy: ctx.user.id,
          performedByName: ctx.user.name ?? ctx.user.email,
          performedByEmail: ctx.user.email,
          notes: null,
        });

        return { success: true };
      }),

    // Bulk delete multiple leads by ID (requires PIN)
    bulkDeleteLeads: protectedProcedure
      .input(z.object({ ids: z.array(z.number()).min(1), pin: z.string().length(6) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Verify PIN
        const [pinRow] = await db
          .select()
          .from(schema.adminConfig)
          .where(eq(schema.adminConfig.key, 'delete_pin'))
          .limit(1);
        if (!pinRow) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'No delete PIN configured. Please set one in Admin Settings.' });
        if (pinRow.value !== input.pin) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Incorrect PIN. Please try again.' });

        // Fetch lead names before deleting
        const leads = await db
          .select({ id: schema.trialSignups.id, name: schema.trialSignups.name })
          .from(schema.trialSignups)
          .where(inArray(schema.trialSignups.id, input.ids));

        await db
          .delete(schema.trialSignups)
          .where(inArray(schema.trialSignups.id, input.ids));

        // Write audit log entries for each deleted lead
        if (leads.length > 0) {
          await db.insert(schema.deletionAuditLog).values(
            leads.map(lead => ({
              targetType: 'lead' as const,
              targetId: lead.id,
              targetName: lead.name ?? `Lead #${lead.id}`,
              performedBy: ctx.user.id,
              performedByName: ctx.user.name ?? ctx.user.email,
              performedByEmail: ctx.user.email,
              notes: `Bulk delete of ${input.ids.length} leads`,
            }))
          );
        }

        return { success: true, deletedCount: input.ids.length };
      }),

    // Update lead pipeline stage (Kanban drag-and-drop)
    updateLeadPipelineStage: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          pipelineStage: z.enum(["new_lead", "contacted", "intro_scheduled", "showed_up", "offer_presented", "enrolled", "nurture"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Auto-assign to the staff member moving the lead if it's unassigned and stage is past new_lead
        const updateFields: Record<string, unknown> = { pipelineStage: input.pipelineStage };

        if (input.pipelineStage !== 'new_lead' && ctx.user) {
          const [existing] = await db
            .select({ assignedStaffId: schema.trialSignups.assignedStaffId })
            .from(schema.trialSignups)
            .where(eq(schema.trialSignups.id, input.id))
            .limit(1);

          if (existing && !existing.assignedStaffId) {
            updateFields.assignedStaffId = ctx.user.id;
            updateFields.assignedStaffName = ctx.user.name;
            updateFields.assignedAt = new Date();
          }
        }

        await db
          .update(schema.trialSignups)
          .set(updateFields)
          .where(eq(schema.trialSignups.id, input.id));

        // ── Auto-convert to student when moved to "enrolled" ──────────────────
        if (input.pipelineStage === 'enrolled') {
          // Fetch the full lead record
          const [lead] = await db
            .select()
            .from(schema.trialSignups)
            .where(eq(schema.trialSignups.id, input.id))
            .limit(1);

          if (lead) {
            // Check if a student record already exists for this lead
            const [existingStudent] = await db
              .select({ id: schema.students.id })
              .from(schema.students)
              .where(eq(schema.students.leadId, input.id))
              .limit(1);

            if (!existingStudent) {
              // Map lead program to student program enum
              const programMap: Record<string, string> = {
                'Little Ninjas': 'Little Ninjas',
                'Dragon Kids': 'Dragon Kids',
                'Teens': 'Teens',
                'Adult Karate': 'Adult Karate',
                'Kickboxing': 'Kickboxing',
                'After School': 'After School',
                'Summer Camp': 'Summer Camp',
                'Not Sure': 'Dragon Kids', // default fallback
              };
              const studentProgram = (programMap[lead.program] ?? 'Dragon Kids') as 'Little Ninjas' | 'Dragon Kids' | 'Teens' | 'Adult Karate' | 'Kickboxing' | 'After School' | 'Summer Camp';

              await db.insert(schema.students).values({
                leadId: input.id,
                name: lead.name,
                program: studentProgram,
                status: 'active',
                location: lead.location ?? 'Tomball HQ',
              });

              console.log(`[LeadConvert] Lead #${input.id} (${lead.name}) auto-converted to student record.`);
            }
          }
        }

        return { success: true };
      }),

    // Get a single lead by ID (for the slide-out detail panel)
    getLeadById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const [lead] = await db
          .select()
          .from(schema.trialSignups)
          .where(eq(schema.trialSignups.id, input.id))
          .limit(1);

        if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });
        return lead;
      }),

    // Update lead notes
    updateLeadNotes: protectedProcedure
      .input(z.object({ id: z.number(), notes: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        await db
          .update(schema.trialSignups)
          .set({ notes: input.notes })
          .where(eq(schema.trialSignups.id, input.id));

        return { success: true };
      }),

    // Manually trigger the intro reminder job (admin use)
    triggerIntroReminders: protectedProcedure
      .mutation(async () => {
        const { runIntroReminderJob } = await import('./introReminderJob');
        await runIntroReminderJob();
        return { success: true };
      }),

    // Manually trigger the GHL contact sync job (admin use)
    triggerGHLSync: protectedProcedure
      .mutation(async () => {
        const { runGHLSyncJob } = await import('./ghlSyncJob');
        await runGHLSyncJob();
        return { success: true };
      }),

    // Test staff SMS notifications — sends a test message to all staff with SMS enabled
    testStaffNotification: protectedProcedure
      .mutation(async () => {
        const { notifyStaffNewLead } = await import('./notifyStaffNewLead');
        await notifyStaffNewLead({
          name: 'TEST LEAD (Staff Notification Check)',
          phone: '(555) 000-0000',
          program: 'Kickboxing',
          source: 'System Test',
        });
        return { success: true };
      }),

    // Manually trigger the no-show follow-up SMS job (admin use)
    triggerNoShowFollowUp: protectedProcedure
      .mutation(async () => {
        const { runNoShowFollowUpJob } = await import('./noShowFollowUpJob');
        await runNoShowFollowUpJob();
        return { success: true };
      }),

    // Get no-show stats: how many leads are pending follow-up vs already sent
    getNoShowStats: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return { pending: 0, sent: 0, recentlySent: [] };

        // Leads that are no-shows (past scheduled time, still in intro_scheduled, not cancelled)
        const pending = await db
          .select({
            id: schema.trialSignups.id,
            name: schema.trialSignups.name,
            phone: schema.trialSignups.phone,
            program: schema.trialSignups.program,
            scheduledTime: schema.trialSignups.scheduledTime,
            noShowSentAt: schema.trialSignups.noShowSentAt,
          })
          .from(schema.trialSignups)
          .where(
            sql`${schema.trialSignups.scheduledTime} IS NOT NULL
                AND ${schema.trialSignups.noShowSentAt} IS NULL
                AND ${schema.trialSignups.pipelineStage} = 'intro_scheduled'
                AND ${schema.trialSignups.status} != 'cancelled'
                AND ${schema.trialSignups.scheduledTime} < DATE_SUB(NOW(), INTERVAL 1 HOUR)`
          );

        // Leads that already received a no-show SMS (last 7 days)
        const recentlySent = await db
          .select({
            id: schema.trialSignups.id,
            name: schema.trialSignups.name,
            phone: schema.trialSignups.phone,
            program: schema.trialSignups.program,
            scheduledTime: schema.trialSignups.scheduledTime,
            noShowSentAt: schema.trialSignups.noShowSentAt,
          })
          .from(schema.trialSignups)
          .where(
            sql`${schema.trialSignups.noShowSentAt} IS NOT NULL
                AND ${schema.trialSignups.noShowSentAt} > DATE_SUB(NOW(), INTERVAL 7 DAY)`
          )
          .orderBy(sql`${schema.trialSignups.noShowSentAt} DESC`)
          .limit(20);

        return {
          pending: pending.length,
          sent: recentlySent.length,
          recentlySent,
          pendingLeads: pending,
        };
      }),

    // Send a promotional SMS blast to all leads and/or staff
    sendPromoBlast: protectedProcedure
      .input(z.object({
        message: z.string().min(10).max(500),
        staffMessage: z.string().min(10).max(500).optional(),
        sendToLeads: z.boolean().default(true),
        sendToStaff: z.boolean().default(true),
        excludeEnrolled: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { sendSms } = await import('./sms800');

        let successCount = 0;
        let failCount = 0;
        const errors: string[] = [];

        // Send to staff
        if (input.sendToStaff) {
          const staffList = await db
            .select({ name: schema.users.name, phone: schema.users.phone })
            .from(schema.users)
            .where(and(
              isNotNull(schema.users.phone),
              sql`${schema.users.phone} != ''`,
              sql`${schema.users.role} IN ('admin','staff')`
            ));
          const staffMsg = input.staffMessage || input.message;
          for (const s of staffList) {
            if (!s.phone) continue;
            try {
              await sendSms({ to: s.phone, message: staffMsg });
              successCount++;
            } catch (e: any) {
              failCount++;
              errors.push(`Staff ${s.name}: ${e.message}`);
            }
          }
        }

        // Send to leads
        if (input.sendToLeads) {
          const stagesExcluded = input.excludeEnrolled ? ['enrolled'] : [];
          const leads = await db
            .select({ name: schema.trialSignups.name, phone: schema.trialSignups.phone, pipelineStage: schema.trialSignups.pipelineStage })
            .from(schema.trialSignups)
            .where(and(
              isNotNull(schema.trialSignups.phone),
              sql`${schema.trialSignups.phone} != ''`,
              stagesExcluded.length > 0
                ? sql`${schema.trialSignups.pipelineStage} NOT IN (${sql.join(stagesExcluded.map(s => sql`${s}`), sql`, `)})`
                : sql`1=1`
            ));
          for (const lead of leads) {
            if (!lead.phone) continue;
            try {
              await sendSms({ to: lead.phone, message: input.message });
              successCount++;
            } catch (e: any) {
              failCount++;
              errors.push(`Lead ${lead.name}: ${e.message}`);
            }
          }
        }

        return { successCount, failCount, errors: errors.slice(0, 10) };
      }),

    // Get reminder stats: how many leads have reminders pending / sent
    getReminderStats: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return { pending: 0, sent: 0, upcoming: [] };
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        // Leads with a scheduled intro in the next 48 hours
        const upcoming = await db
          .select({
            id: schema.trialSignups.id,
            name: schema.trialSignups.name,
            phone: schema.trialSignups.phone,
            program: schema.trialSignups.program,
            scheduledTime: schema.trialSignups.scheduledTime,
            reminderSentAt: schema.trialSignups.reminderSentAt,
          })
          .from(schema.trialSignups)
          .where(
            and(
              isNotNull(schema.trialSignups.scheduledTime),
              between(schema.trialSignups.scheduledTime!, now, in48h)
            )
          )
          .orderBy(schema.trialSignups.scheduledTime);
        const sent = upcoming.filter(l => l.reminderSentAt !== null).length;
        const pending = upcoming.filter(l => l.reminderSentAt === null).length;
        return { pending, sent, upcoming };
      }),

    // Get class schedule slots filtered by program (for booking form)
    getClassSchedulesByProgram: protectedProcedure
      .input(z.object({
        program: z.string(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        const conditions = [eq(schema.classSchedule.isActive, 1)];
        if (input.program && input.program !== 'Not Sure') {
          conditions.push(eq(schema.classSchedule.program, input.program as any));
        }
        const rows = await db
          .select()
          .from(schema.classSchedule)
          .where(and(...conditions))
          .orderBy(schema.classSchedule.dayOfWeek, schema.classSchedule.startTime);
        return rows;
      }),

    // Schedule intro lesson for a lead
    scheduleIntroLesson: protectedProcedure
      .input(z.object({
        id: z.number(),
        scheduledTime: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        await db
          .update(schema.trialSignups)
          .set({
            scheduledTime: input.scheduledTime,
            pipelineStage: 'intro_scheduled',
            status: 'scheduled',
          })
          .where(eq(schema.trialSignups.id, input.id));

        return { success: true };
      }),

    // Update lead status
    updateLeadStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "scheduled", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        await db
          .update(schema.trialSignups)
          .set({ status: input.status })
          .where(eq(schema.trialSignups.id, input.id));

        return { success: true };
      }),

    // Send SMS to a lead via 800.com API
    sendLeadSms: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        phone: z.string(),
        message: z.string().min(1).max(600),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        const { sendSms } = await import('./sms800');
        const result = await sendSms({ to: input.phone, message: input.message });
        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error ?? 'Failed to send SMS',
          });
        }
        // Stamp lastContactedAt on successful SMS send and auto-assign if unassigned
        if (db) {
          const [existing] = await db
            .select({ assignedStaffId: schema.trialSignups.assignedStaffId })
            .from(schema.trialSignups)
            .where(eq(schema.trialSignups.id, input.leadId))
            .limit(1);

          const updateFields: Record<string, unknown> = {
            lastContactedAt: new Date(),
            lastContactMethod: 'text',
          };

          if (existing && !existing.assignedStaffId && ctx.user) {
            updateFields.assignedStaffId = ctx.user.id;
            updateFields.assignedStaffName = ctx.user.name;
            updateFields.assignedAt = new Date();
          }

          await db
            .update(schema.trialSignups)
            .set(updateFields)
            .where(eq(schema.trialSignups.id, input.leadId));
        }
        return { success: true, messageId: result.messageId };
      }),

    // Record a contact attempt (call or email) — stamps lastContactedAt
    recordContact: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        method: z.enum(['call', 'text', 'email']),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Check if lead is currently unassigned
        const [existing] = await db
          .select({ assignedStaffId: schema.trialSignups.assignedStaffId })
          .from(schema.trialSignups)
          .where(eq(schema.trialSignups.id, input.leadId))
          .limit(1);

        const updateFields: Record<string, unknown> = {
          lastContactedAt: new Date(),
          lastContactMethod: input.method,
        };

        // Auto-assign to the staff member making first contact if unassigned
        if (existing && !existing.assignedStaffId && ctx.user) {
          updateFields.assignedStaffId = ctx.user.id;
          updateFields.assignedStaffName = ctx.user.name;
          updateFields.assignedAt = new Date();
        }

        await db
          .update(schema.trialSignups)
          .set(updateFields)
          .where(eq(schema.trialSignups.id, input.leadId));
        return { success: true, autoAssigned: !existing?.assignedStaffId && !!ctx.user };
      }),

    // Accept a staff invite — public procedure, called after the user logs in
    // The frontend passes the token from the URL; this grants the staff role
    acceptStaffInvite: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please log in to accept this invitation' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Look up the invite
        const [invite] = await db
          .select()
          .from(schema.staffInvites)
          .where(eq(schema.staffInvites.token, input.token))
          .limit(1);

        if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invitation not found or already used' });
        if (invite.accepted) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invitation has already been accepted' });
        if (new Date() > new Date(invite.expiresAt)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This invitation has expired. Please ask an admin to resend it.' });

        // Grant the role to the logged-in user
        await db
          .update(schema.users)
          .set({ role: invite.inviteRole })
          .where(eq(schema.users.id, ctx.user.id));

        // Mark invite as accepted
        await db
          .update(schema.staffInvites)
          .set({ accepted: 1, acceptedAt: new Date(), acceptedByUserId: ctx.user.id })
          .where(eq(schema.staffInvites.id, invite.id));

        return { success: true, role: invite.inviteRole };
      }),

    // Get dashboard stats (admin)
    getDashboardStats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // CST today date string (YYYY-MM-DD)
      const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      const todayStr = `${nowCST.getFullYear()}-${String(nowCST.getMonth() + 1).padStart(2, '0')}-${String(nowCST.getDate()).padStart(2, '0')}`;

      // Start of this week (Monday CST)
      const weekStart = new Date(nowCST);
      weekStart.setDate(nowCST.getDate() - ((nowCST.getDay() + 6) % 7));
      weekStart.setHours(0, 0, 0, 0);

      // Start of this month CST
      const monthStart = new Date(nowCST.getFullYear(), nowCST.getMonth(), 1);

      // 1. Active members (enrollments with status = 'active')
      const [{ activeMembers }] = await db
        .select({ activeMembers: sql<number>`COUNT(*)` })
        .from(schema.enrollments)
        .where(eq(schema.enrollments.status, 'active'));

      // 2. Check-ins today (attendance table, checkInDate = today)
      const [{ checkInsToday }] = await db
        .select({ checkInsToday: sql<number>`COUNT(*)` })
        .from(schema.attendance)
        .where(eq(schema.attendance.checkInDate, todayStr));

      // 3. Total leads (all trialSignups)
      const [{ totalLeads }] = await db
        .select({ totalLeads: sql<number>`COUNT(*)` })
        .from(schema.trialSignups);

      // 4. New leads this week
      const [{ newLeadsThisWeek }] = await db
        .select({ newLeadsThisWeek: sql<number>`COUNT(*)` })
        .from(schema.trialSignups)
        .where(sql`${schema.trialSignups.createdAt} >= ${weekStart}`);

      // 5. Enrolled this month (pipelineStage = 'enrolled' and createdAt >= monthStart)
      const [{ enrolledThisMonth }] = await db
        .select({ enrolledThisMonth: sql<number>`COUNT(*)` })
        .from(schema.trialSignups)
        .where(and(
          eq(schema.trialSignups.pipelineStage, 'enrolled'),
          sql`${schema.trialSignups.updatedAt} >= ${monthStart}`
        ));

      // 6. Leads by pipeline stage
      const stageRows = await db
        .select({
          stage: schema.trialSignups.pipelineStage,
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.trialSignups)
        .groupBy(schema.trialSignups.pipelineStage);

      // 7. Recent leads (last 5)
      const recentLeads = await db
        .select({
          id: schema.trialSignups.id,
          name: schema.trialSignups.name,
          program: schema.trialSignups.program,
          phone: schema.trialSignups.phone,
          pipelineStage: schema.trialSignups.pipelineStage,
          source: schema.trialSignups.source,
          createdAt: schema.trialSignups.createdAt,
        })
        .from(schema.trialSignups)
        .orderBy(desc(schema.trialSignups.createdAt))
        .limit(5);

      // 8. Recent check-ins (last 5)
      const recentCheckIns = await db
        .select({
          id: schema.attendance.id,
          studentName: schema.enrollments.studentName,
          customerName: schema.enrollments.customerName,
          program: schema.membershipPackages.name,
          checkInTimestamp: schema.attendance.checkInTimestamp,
          source: schema.attendance.source,
        })
        .from(schema.attendance)
        .leftJoin(schema.enrollments, eq(schema.attendance.enrollmentId, schema.enrollments.id))
        .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
        .orderBy(desc(schema.attendance.checkInTimestamp))
        .limit(5);

      return {
        activeMembers: Number(activeMembers),
        checkInsToday: Number(checkInsToday),
        totalLeads: Number(totalLeads),
        newLeadsThisWeek: Number(newLeadsThisWeek),
        enrolledThisMonth: Number(enrolledThisMonth),
        leadsByStage: stageRows.map(r => ({ stage: r.stage, count: Number(r.count) })),
        recentLeads,
        recentCheckIns,
      };
    }),

    // Get all students (admin) - queries enrollments table joined with membership packages
    getAllStudents: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        program: z.string().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Only show real Stripe-paying members (must have a stripeCustomerId).
        // Test/seed data entries without Stripe IDs are excluded from the roster.
        const rows = await db
          .select({
            id: schema.enrollments.id,
            name: schema.enrollments.customerName,
            studentName: schema.enrollments.studentName,
            email: schema.enrollments.customerEmail,
            phone: schema.enrollments.customerPhone,
            program: schema.membershipPackages.name,
            status: schema.enrollments.status,
            beltRank: schema.enrollments.beltRank,
            dateOfBirth: schema.enrollments.dateOfBirth,
            stripeSubscriptionId: schema.enrollments.stripeSubscriptionId,
            stripeCustomerId: schema.enrollments.stripeCustomerId,
            photoUrl: schema.enrollments.photoUrl,
            currentStreak: schema.enrollments.currentStreak,
            longestStreak: schema.enrollments.longestStreak,
            beltExamEligible: schema.enrollments.beltExamEligible,
            beltExamFeePaid: schema.enrollments.beltExamFeePaid,
            createdAt: schema.enrollments.createdAt,
            updatedAt: schema.enrollments.updatedAt,
          })
          .from(schema.enrollments)
          .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
          .orderBy(desc(schema.enrollments.createdAt));
        // Map to a normalized shape for the UI
        let filtered = rows.map(r => ({
          ...r,
          program: r.program ?? 'Unknown',
          // Map 'failed' enrollment status to 'cancelled' for display
          status: (r.status === 'failed' ? 'cancelled' : r.status) as 'active' | 'pending' | 'inactive' | 'cancelled',
          location: 'Tomball HQ',
          age: null as null | number,
        }));
        if (input?.search) {
          const q = input.search.toLowerCase();
          filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            (s.studentName ?? '').toLowerCase().includes(q)
          );
        }
        if (input?.program && input.program !== 'all') {
          filtered = filtered.filter(s => s.program === input.program);
        }
        if (input?.status && input.status !== 'all') {
          filtered = filtered.filter(s => s.status === input.status);
        }
        // Merge child profile photos: for students without an enrollment photo,
        // look up a matching child profile by name and use that photo instead.
        const studentsNeedingPhoto = filtered.filter(s => !s.photoUrl);
        if (studentsNeedingPhoto.length > 0) {
          const childProfiles = await db
            .select({ name: schema.childProfiles.name, photoUrl: schema.childProfiles.photoUrl })
            .from(schema.childProfiles)
            .where(isNotNull(schema.childProfiles.photoUrl));
          // Build a lowercase name → photoUrl map for fast lookup
          const photoMap = new Map<string, string>();
          for (const cp of childProfiles) {
            if (cp.photoUrl) photoMap.set(cp.name.toLowerCase().trim(), cp.photoUrl);
          }
          filtered = filtered.map(s => {
            if (s.photoUrl) return s;
            // Try matching on studentName first, then customerName
            const lookupName = (s.studentName ?? s.name ?? '').toLowerCase().trim();
            const matchedPhoto = photoMap.get(lookupName) ?? null;
            return matchedPhoto ? { ...s, photoUrl: matchedPhoto } : s;
          });
        }
        return filtered;
      }),

    // Update student status (admin) - updates enrollments table
    updateStudentStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'active', 'inactive', 'cancelled']),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Map 'inactive' to a valid enrollment status ('cancelled')
        const enrollmentStatus = input.status === 'inactive' ? 'cancelled' : input.status as 'pending' | 'active' | 'cancelled';
        await db
          .update(schema.enrollments)
          .set({ status: enrollmentStatus })
          .where(eq(schema.enrollments.id, input.id));
        return { success: true };
      }),

    // Update student details (admin) - updates name, email, phone, belt rank, DOB
    updateStudent: protectedProcedure
      .input(z.object({
        id: z.number(),
        customerName: z.string().min(1).optional(),
        studentName: z.string().optional(),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().optional(),
        dateOfBirth: z.string().optional(), // YYYY-MM-DD
        beltRank: z.enum([
          'No Belt', 'White Belt', 'Yellow Belt', 'Orange Belt', 'Green Belt',
          'Advanced Green', 'Blue Belt', 'Advanced Blue', 'Purple Belt', 'Advanced Purple',
          'Brown Belt', 'Advanced Brown', 'Probationary Black', 'Black Belt 1st Dan',
          'Black Belt 2nd Dan', 'Black Belt 3rd Dan', 'Black Belt 4th Dan', 'Black Belt 5th Dan', 'Black Belt 6th Dan'
        ]).optional(),
        status: z.enum(['pending', 'active', 'cancelled', 'completed', 'failed']).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { id, ...updates } = input;
        // Build update payload — only include fields that were provided
        const payload: Record<string, unknown> = {};
        if (updates.customerName !== undefined) payload.customerName = updates.customerName;
        if (updates.studentName !== undefined) payload.studentName = updates.studentName;
        if (updates.customerEmail !== undefined) payload.customerEmail = updates.customerEmail;
        if (updates.customerPhone !== undefined) payload.customerPhone = updates.customerPhone;
        if (updates.dateOfBirth !== undefined) payload.dateOfBirth = updates.dateOfBirth;
        if (updates.beltRank !== undefined) payload.beltRank = updates.beltRank;
        if (updates.status !== undefined) payload.status = updates.status;
        if (Object.keys(payload).length === 0) return { success: true };
        await db
          .update(schema.enrollments)
          .set(payload)
          .where(eq(schema.enrollments.id, id));
        return { success: true };
      }),

    // ── Promote Belt (admin/instructor only) ─────────────────────────────────────
    promoteBelt: protectedProcedure
      .input(z.object({
        enrollmentId: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Only admins and staff can promote belts
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins and staff can promote belts' });
        }

        const { nextBeltRank, requiresBeltExam } = await import('../shared/const.js');

        // Fetch the enrollment
        const [enrollment] = await db
          .select({
            id: schema.enrollments.id,
            beltRank: schema.enrollments.beltRank,
            classesAtCurrentBelt: schema.enrollments.classesAtCurrentBelt,
            studentName: schema.enrollments.studentName,
            customerName: schema.enrollments.customerName,
          })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, input.enrollmentId))
          .limit(1);

        if (!enrollment) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
        }

        const currentBelt = enrollment.beltRank ?? 'No Belt';
        const nextBelt = nextBeltRank(currentBelt);

        if (!nextBelt) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Student is already at the highest belt rank' });
        }

        const studentName = enrollment.studentName || enrollment.customerName || 'Unknown';
        const classesAtPromotion = enrollment.classesAtCurrentBelt ?? 0;

        // Update enrollment: advance belt, reset stripe counters
        await db
          .update(schema.enrollments)
          .set({
            beltRank: nextBelt as typeof schema.enrollments.beltRank._.data,
            beltAchievedDate: new Date(),
            classesAtCurrentBelt: 0,
            currentStripePhase: 1,
            stripesInCurrentPhase: 0,
            beltExamEligible: 0,
            beltExamFeePaid: 0,
            beltExamPaymentId: null,
          })
          .where(eq(schema.enrollments.id, input.enrollmentId));

        // Write audit record to beltPromotions table
        await db
          .insert(schema.beltPromotions)
          .values({
            enrollmentId: input.enrollmentId,
            studentName,
            fromBelt: currentBelt,
            toBelt: nextBelt,
            classesAtPromotion,
            promotedBy: ctx.user.id,
            promotedByName: ctx.user.name ?? ctx.user.email ?? 'Admin',
            notes: input.notes ?? null,
          });

        return {
          success: true,
          fromBelt: currentBelt,
          toBelt: nextBelt,
          studentName,
          requiresExam: requiresBeltExam(nextBelt),
        };
      }),

    // Get belt promotion history for a student
    getBeltPromotionHistory: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const rows = await db
          .select()
          .from(schema.beltPromotions)
          .where(eq(schema.beltPromotions.enrollmentId, input.enrollmentId))
          .orderBy(desc(schema.beltPromotions.createdAt));
        return rows;
      }),

    // Get all attendance records (admin)
    getAllAttendance: protectedProcedure
      .input(z.object({
        date: z.string().optional(),
        studentId: z.number().optional(),
        limit: z.number().optional().default(100),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Build SQL-level conditions so date/student filters apply before the LIMIT
        const conditions = [];
        if (input?.date) {
          conditions.push(eq(schema.attendance.checkInDate, input.date));
        }
        if (input?.studentId) {
          conditions.push(eq(schema.attendance.studentId, input.studentId));
        }
        const rows = await db
          .select({
            id: schema.attendance.id,
            studentId: schema.attendance.studentId,
            studentName: sql<string>`COALESCE(${schema.enrollments.studentName}, ${schema.enrollments.customerName}, CONCAT('Student #', ${schema.attendance.studentId}))`,
            parentName: schema.enrollments.customerName,
            studentPhoto: schema.enrollments.photoUrl,
            program: sql<string>`COALESCE(${schema.membershipPackages.name}, ${schema.attendance.programType})`,
            checkInTimestamp: schema.attendance.checkInTimestamp,
            checkInDate: schema.attendance.checkInDate,
            source: schema.attendance.source,
            xpAwarded: schema.attendance.xpAwarded,
            notes: schema.attendance.notes,
          })
          .from(schema.attendance)
          .leftJoin(schema.enrollments, eq(schema.attendance.enrollmentId, schema.enrollments.id))
          .leftJoin(schema.membershipPackages, eq(schema.enrollments.membershipPackageId, schema.membershipPackages.id))
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.attendance.checkInTimestamp))
          .limit(input?.limit ?? 200);
        return rows;
      }),

    // Manual check-in for a student (admin)
    manualCheckIn: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Fetch enrollment to get current streak before update
        const enrollmentBefore = await db
          .select()
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, input.studentId))
          .limit(1);

        if (!enrollmentBefore[0]) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Student enrollment not found' });
        }

        const prevStreak = enrollmentBefore[0]?.currentStreak ?? 0;

        // Insert attendance record — set both studentId and enrollmentId so getAllAttendance join works
        await db.insert(schema.attendance).values({
          studentId: input.studentId,
          enrollmentId: input.studentId, // enrollment id == studentId in this flow
          checkInDate: input.date,
          checkInTimestamp: new Date(),
          source: (ctx.user.role === 'staff' ? 'staff' : 'admin') as 'admin' | 'staff',
          xpAwarded: 10,
          notes: input.notes || null,
        });

        // Update streak on enrollment
        const today = input.date;
        const lastCheckIn = enrollmentBefore[0]?.lastCheckInDate;
        let newStreak = 1;
        if (lastCheckIn) {
          const lastDate = new Date(lastCheckIn);
          const todayDate = new Date(today);
          const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            newStreak = prevStreak + 1;
          } else if (daysDiff === 0) {
            newStreak = prevStreak || 1;
          } else {
            newStreak = 1;
          }
        }
        const longestStreak = Math.max(newStreak, enrollmentBefore[0]?.longestStreak ?? 0);

        await db
          .update(schema.enrollments)
          .set({
            currentStreak: newStreak,
            longestStreak,
            lastCheckInDate: today,
            totalXP: (enrollmentBefore[0]?.totalXP ?? 0) + 10,
          })
          .where(eq(schema.enrollments.id, input.studentId));

        // Check for streak milestone and send email
        const milestone = checkStreakMilestone(prevStreak, newStreak);
        if (milestone && enrollmentBefore[0]) {
          const enrollment = enrollmentBefore[0];
          // Check we haven't already sent this milestone
          const existing = await db
            .select()
            .from(schema.streakMilestones)
            .where(
              and(
                eq(schema.streakMilestones.enrollmentId, enrollment.id),
                eq(schema.streakMilestones.milestone, milestone)
              )
            )
            .limit(1);

          if (!existing[0] && enrollment.customerEmail) {
            // Get membership package name for the email
            const pkg = await db
              .select()
              .from(schema.membershipPackages)
              .where(eq(schema.membershipPackages.id, enrollment.membershipPackageId))
              .limit(1);

            const emailSent = await sendStreakMilestoneEmail({
              toEmail: enrollment.customerEmail,
              toName: enrollment.customerName,
              streak: milestone,
              program: pkg[0]?.name ?? 'Martial Arts',
              beltRank: enrollment.beltRank ?? undefined,
            });

            // Log the milestone
            await db.insert(schema.streakMilestones).values({
              enrollmentId: enrollment.id,
              milestone,
              emailSentTo: enrollment.customerEmail,
              emailSent: emailSent ? 1 : 0,
              streakAtMilestone: newStreak,
            });

            console.log(`[Milestone] ${enrollment.customerName} hit ${milestone}-class streak. Email sent: ${emailSent}`);
          }
        }

        return { success: true, newStreak, milestone: milestone ?? undefined };
      }),

    // Get streak milestone history (admin)
    getStreakMilestones: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const rows = await db
        .select({
          id: schema.streakMilestones.id,
          milestone: schema.streakMilestones.milestone,
          emailSentTo: schema.streakMilestones.emailSentTo,
          emailSent: schema.streakMilestones.emailSent,
          streakAtMilestone: schema.streakMilestones.streakAtMilestone,
          createdAt: schema.streakMilestones.createdAt,
          studentName: schema.enrollments.customerName,
          program: schema.enrollments.membershipPackageId,
        })
        .from(schema.streakMilestones)
        .leftJoin(schema.enrollments, eq(schema.streakMilestones.enrollmentId, schema.enrollments.id))
        .orderBy(desc(schema.streakMilestones.createdAt))
        .limit(100);
      return rows;
    }),

    // Resend a streak milestone email (admin)
    resendMilestoneEmail: protectedProcedure
      .input(z.object({ milestoneId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Fetch the milestone record with enrollment details
        const rows = await db
          .select({
            id: schema.streakMilestones.id,
            milestone: schema.streakMilestones.milestone,
            emailSentTo: schema.streakMilestones.emailSentTo,
            enrollmentId: schema.streakMilestones.enrollmentId,
            studentName: schema.enrollments.customerName,
            beltRank: schema.enrollments.beltRank,
            membershipPackageId: schema.enrollments.membershipPackageId,
          })
          .from(schema.streakMilestones)
          .leftJoin(schema.enrollments, eq(schema.streakMilestones.enrollmentId, schema.enrollments.id))
          .where(eq(schema.streakMilestones.id, input.milestoneId))
          .limit(1);

        if (!rows.length) throw new TRPCError({ code: 'NOT_FOUND', message: 'Milestone not found' });
        const row = rows[0];

        // Fetch the package name
        let programName = 'Martial Arts';
        if (row.membershipPackageId) {
          const pkg = await db
            .select({ name: schema.membershipPackages.name })
            .from(schema.membershipPackages)
            .where(eq(schema.membershipPackages.id, row.membershipPackageId))
            .limit(1);
          if (pkg.length) programName = pkg[0].name;
        }

        // Re-send the email
        const emailSent = await sendStreakMilestoneEmail({
          toEmail: row.emailSentTo ?? '',
          toName: row.studentName ?? 'Student',
          streak: row.milestone,
          program: programName,
          beltRank: row.beltRank ?? undefined,
        });

        // Update the milestone record with the new delivery status
        await db
          .update(schema.streakMilestones)
          .set({ emailSent: emailSent ? 1 : 0 })
          .where(eq(schema.streakMilestones.id, input.milestoneId));

        return { success: emailSent };
      }),

    // Resend belt exam eligibility email to a student (admin)
    resendBeltExamEmail: protectedProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const [enrollment] = await db
          .select({
            id: schema.enrollments.id,
            beltRank: schema.enrollments.beltRank,
            customerName: schema.enrollments.customerName,
            studentName: schema.enrollments.studentName,
            customerEmail: schema.enrollments.customerEmail,
            beltExamFeePaid: schema.enrollments.beltExamFeePaid,
          })
          .from(schema.enrollments)
          .where(eq(schema.enrollments.id, input.enrollmentId))
          .limit(1);

        if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND', message: 'Enrollment not found' });
        if (!enrollment.customerEmail) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No email address on file' });
        if (enrollment.beltExamFeePaid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Exam fee already paid — no need to resend' });

        const { requiresBeltExam, nextBeltRank, BELT_EXAM_FEE } = await import('../shared/const.js');
        const currentBelt = enrollment.beltRank ?? 'Orange Belt';
        const examBelt = nextBeltRank(currentBelt);

        if (!requiresBeltExam(currentBelt) || !examBelt) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `${currentBelt} does not require a belt exam` });
        }

        // Create a fresh Stripe checkout session
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(
          process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '',
          { apiVersion: '2026-01-28.clover' as any }
        );
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: enrollment.customerEmail,
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Belt Exam Fee — ${currentBelt} → ${examBelt}`,
                description: 'MyDojo belt examination fee. Includes instructor evaluation and belt certificate.',
              },
              unit_amount: BELT_EXAM_FEE * 100,
            },
            quantity: 1,
          }],
          metadata: {
            type: 'belt_exam',
            enrollment_id: enrollment.id.toString(),
            student_name: enrollment.studentName || enrollment.customerName || 'Student',
            belt_rank: currentBelt,
          },
          client_reference_id: enrollment.id.toString(),
          success_url: 'https://www.mydojoma.com/member/dashboard?belt_exam=success',
          cancel_url: 'https://www.mydojoma.com/member/dashboard?belt_exam=cancelled',
          allow_promotion_codes: true,
        });

        if (!session.url) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create checkout session' });

        // Ensure eligible flag is set
        await db
          .update(schema.enrollments)
          .set({ beltExamEligible: 1 })
          .where(eq(schema.enrollments.id, enrollment.id));

        const { sendBeltExamEligibleEmail } = await import('./emailService.js');
        const sent = await sendBeltExamEligibleEmail({
          to: enrollment.customerEmail,
          studentName: enrollment.studentName || enrollment.customerName || 'Student',
          currentBelt,
          examBelt,
          examFeeDollars: BELT_EXAM_FEE,
          checkoutUrl: session.url,
        });

        return { success: sent, checkoutUrl: session.url };
      }),

    // Get all class schedules (admin)
    getAllClasses: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      return db.select().from(schema.classSchedule).orderBy(schema.classSchedule.dayOfWeek, schema.classSchedule.startTime);
    }),

    // Create a class schedule (admin)
    createClass: protectedProcedure
      .input(z.object({
        program: z.enum([
          'Little Ninjas', 'Little Ninjas & Me',
          'Dragon Kids', 'Dragon Kids & Teens',
          'Teens', 'Teen Warriors',
          'Adult Karate', 'Adult Karate + Kickboxing',
          'Kickboxing', 'Advanced/Black Belt + Kickboxing',
          'After School', 'Summer Camp',
          'Intro Class', 'Leadership', 'Sparring', 'Weapons Class',
          "Women's Self-Defense", 'Family Class', 'Instructor Training', 'Demo/Competition Team'
        ]),
        location: z.string().min(1),
        dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
        instructor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const result = await db.insert(schema.classSchedule).values({
          program: input.program,
          location: input.location,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          instructor: input.instructor || null,
          isActive: 1,
        });
        return { success: true, id: (result as any).insertId };
      }),

    // Update a class schedule (admin)
    updateClass: protectedProcedure
      .input(z.object({
        id: z.number(),
        program: z.enum([
          'Little Ninjas', 'Little Ninjas & Me',
          'Dragon Kids', 'Dragon Kids & Teens',
          'Teens', 'Teen Warriors',
          'Adult Karate', 'Adult Karate + Kickboxing',
          'Kickboxing', 'Advanced/Black Belt + Kickboxing',
          'After School', 'Summer Camp',
          'Intro Class', 'Leadership', 'Sparring', 'Weapons Class',
          "Women's Self-Defense", 'Family Class', 'Instructor Training', 'Demo/Competition Team'
        ]).optional(),
        location: z.string().min(1).optional(),
        dayOfWeek: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).optional(),
        startTime: z.string().min(1).optional(),
        endTime: z.string().min(1).optional(),
        instructor: z.string().nullable().optional(),
        isActive: z.number().min(0).max(1).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const { id, ...updates } = input;
        await db.update(schema.classSchedule).set(updates).where(eq(schema.classSchedule.id, id));
        return { success: true };
      }),

    // Delete a class schedule (admin)
    deleteClass: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await db.delete(schema.classSchedule).where(eq(schema.classSchedule.id, input.id));
        return { success: true };
      }),

    // ─── Staff Invite Procedures ─────────────────────────────────────────────

    // List all staff invites (pending and accepted)
    listStaffInvites: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const invites = await db
        .select()
        .from(schema.staffInvites)
        .orderBy(desc(schema.staffInvites.createdAt));
      return invites;
    }),

    // Create and send a staff invite
    createStaffInvite: protectedProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        role: z.enum(['staff', 'admin']).default('staff'),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Generate a secure random token
        const crypto = await import('crypto');
        const token = crypto.randomBytes(48).toString('hex');

        // Expire in 48 hours
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        // Insert invite record
        await db.insert(schema.staffInvites).values({
          email: input.email,
          name: input.name ?? null,
          token,
          inviteRole: input.role,
          invitedBy: ctx.user.id,
          expiresAt,
        });

        // Build the invite URL
        const baseUrl = 'https://mydojoma.com';
        const inviteUrl = `${baseUrl}/staff-invite?token=${token}`;

        // Send invite email via Resend
        const { Resend } = await import('resend');
        const resend = new Resend(ENV.RESEND_API_KEY);
        const firstName = input.name ? input.name.split(' ')[0] : 'there';
        const roleLabel = input.role === 'admin' ? 'Admin' : 'Staff Member';
        await resend.emails.send({
          from: ENV.EMAIL_FROM,
          to: input.email,
          subject: `You've been invited to join the MyDojo team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
              <div style="background: #dc2626; padding: 24px; text-align: center;">
                <img src="https://static.manus.space/webdev/mydojo-website/logo-black.png" alt="MyDojo" style="height: 48px; filter: brightness(0) invert(1);" />
              </div>
              <div style="padding: 32px;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Hi ${firstName}!</h1>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  You've been invited to join the <strong>MyDojo</strong> team as a <strong>${roleLabel}</strong>.
                  Click the button below to accept your invitation and set up your account.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">This invitation expires in 48 hours.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}" style="background: #dc2626; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Accept Invitation</a>
                </div>
                <p style="color: #9ca3af; font-size: 12px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          `,
        });

        return { success: true, inviteUrl };
      }),

    // Revoke a pending invite
    revokeStaffInvite: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await db.delete(schema.staffInvites).where(eq(schema.staffInvites.id, input.id));
        return { success: true };
      }),

    // Resend a pending staff invite with a fresh token and expiry
    resendStaffInvite: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Fetch the existing invite
        const invites = await db
          .select()
          .from(schema.staffInvites)
          .where(eq(schema.staffInvites.id, input.id))
          .limit(1);
        const invite = invites[0];
        if (!invite) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invite not found' });
        if (invite.acceptedAt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invite already accepted' });

        // Generate a fresh token and reset expiry to 48 hours from now
        const crypto = await import('crypto');
        const token = crypto.randomBytes(48).toString('hex');
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        await db
          .update(schema.staffInvites)
          .set({ token, expiresAt })
          .where(eq(schema.staffInvites.id, input.id));

        // Build the invite URL
        const baseUrl = 'https://mydojoma.com';
        const inviteUrl = `${baseUrl}/staff-invite?token=${token}`;

        // Re-send invite email via Resend
        const { Resend } = await import('resend');
        const resend = new Resend(ENV.RESEND_API_KEY);
        const firstName = invite.name ? invite.name.split(' ')[0] : 'there';
        const roleLabel = invite.inviteRole === 'admin' ? 'Admin' : 'Staff Member';
        await resend.emails.send({
          from: ENV.EMAIL_FROM,
          to: invite.email,
          subject: `Reminder: You've been invited to join the MyDojo team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
              <div style="background: #dc2626; padding: 24px; text-align: center;">
                <img src="https://static.manus.space/webdev/mydojo-website/logo-black.png" alt="MyDojo" style="height: 48px; filter: brightness(0) invert(1);" />
              </div>
              <div style="padding: 32px;">
                <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">Hi ${firstName}!</h1>
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
                  This is a reminder that you've been invited to join the <strong>MyDojo</strong> team as a <strong>${roleLabel}</strong>.
                  Your previous invite link has been refreshed — click the button below to accept.
                </p>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">This invitation expires in 48 hours.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${inviteUrl}" style="background: #dc2626; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Accept Invitation</a>
                </div>
                <p style="color: #9ca3af; font-size: 12px;">If you weren't expecting this invitation, you can safely ignore this email.</p>
              </div>
            </div>
          `,
        });

        return { success: true, inviteUrl };
      }),

    // ─── Internal Messaging ────────────────────────────────────────────────

    // Get all conversations (staff chats + student message threads)
    getConversations: protectedProcedure
      .input(z.object({ type: z.enum(['staff', 'student', 'all']).default('all') }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const rows = await db
          .select()
          .from(schema.conversations)
          .where(input.type === 'all' ? undefined : eq(schema.conversations.type, input.type))
          .orderBy(desc(schema.conversations.updatedAt));
        // For each conversation, get last message and unread count
        const enriched = await Promise.all(rows.map(async (conv) => {
          const [lastMsg] = await db
            .select()
            .from(schema.internalMessages)
            .where(eq(schema.internalMessages.conversationId, conv.id))
            .orderBy(desc(schema.internalMessages.createdAt))
            .limit(1);
          const [{ count: unread }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(schema.internalMessages)
            .where(and(
              eq(schema.internalMessages.conversationId, conv.id),
              isNull(schema.internalMessages.readAt),
              ne(schema.internalMessages.senderRole, 'admin' as const),
            ));
          // For student conversations, get enrollment info
          let studentInfo = null;
          if (conv.enrollmentId) {
            const [enr] = await db
              .select({ id: schema.enrollments.id, customerName: schema.enrollments.customerName, photoUrl: schema.enrollments.photoUrl })
              .from(schema.enrollments)
              .where(eq(schema.enrollments.id, conv.enrollmentId))
              .limit(1);
            studentInfo = enr ?? null;
          }
          return { ...conv, lastMessage: lastMsg ?? null, unreadCount: Number(unread), studentInfo };
        }));
        return enriched;
      }),

    // Get messages in a conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const messages = await db
          .select()
          .from(schema.internalMessages)
          .where(eq(schema.internalMessages.conversationId, input.conversationId))
          .orderBy(asc(schema.internalMessages.createdAt));
        return messages;
      }),

    // Send a message in a conversation
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        body: z.string().min(1).max(5000),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const role = (ctx.user.role as 'admin' | 'staff' | 'user') ?? 'admin';
        const [msg] = await db
          .insert(schema.internalMessages)
          .values({
            conversationId: input.conversationId,
            senderId: ctx.user.id,
            senderName: ctx.user.name ?? ctx.user.email,
            senderRole: role,
            body: input.body,
          })
          .$returningId();
        // Update conversation updatedAt
        await db
          .update(schema.conversations)
          .set({ updatedAt: new Date() })
          .where(eq(schema.conversations.id, input.conversationId));
        return { id: msg.id };
      }),

    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({
        type: z.enum(['staff', 'student']),
        title: z.string().min(1).max(255),
        enrollmentId: z.number().optional(),
        initialMessage: z.string().min(1).max(5000),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const [conv] = await db
          .insert(schema.conversations)
          .values({
            type: input.type,
            title: input.title,
            createdBy: ctx.user.id,
            enrollmentId: input.enrollmentId,
          })
          .$returningId();
        const role = (ctx.user.role as 'admin' | 'staff' | 'user') ?? 'admin';
        await db.insert(schema.internalMessages).values({
          conversationId: conv.id,
          senderId: ctx.user.id,
          senderName: ctx.user.name ?? ctx.user.email,
          senderRole: role,
          body: input.initialMessage,
        });
        return { id: conv.id };
      }),

    // Mark all messages in a conversation as read
    markConversationRead: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await db
          .update(schema.internalMessages)
          .set({ readAt: new Date() })
          .where(and(
            eq(schema.internalMessages.conversationId, input.conversationId),
            isNull(schema.internalMessages.readAt),
            ne(schema.internalMessages.senderId, ctx.user.id),
          ));
        return { success: true };
      }),

    // Delete a conversation
    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await db.delete(schema.internalMessages).where(eq(schema.internalMessages.conversationId, input.id));
        await db.delete(schema.conversations).where(eq(schema.conversations.id, input.id));
        return { success: true };
      }),

    // Upload student profile photo to S3 and save URL
    uploadStudentPhoto: protectedProcedure
      .input(z.object({
        id: z.number(),
        // Base64-encoded image data (data URL stripped of prefix)
        imageBase64: z.string(),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        // Decode base64 to buffer
        const buffer = Buffer.from(input.imageBase64, 'base64');
        if (buffer.length > 5 * 1024 * 1024) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Image must be under 5 MB' });
        }
        const ext = input.mimeType.split('/')[1];
        const randomSuffix = Math.random().toString(36).slice(2, 10);
        const fileKey = `student-photos/${input.id}-${randomSuffix}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        // Persist URL to enrollment record
        await db
          .update(schema.enrollments)
          .set({ photoUrl: url })
          .where(eq(schema.enrollments.id, input.id));
        return { url };
      }),

    getTodaysBirthdays: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Get today's MM-DD
        const today = new Date();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayMMDD = `${mm}-${dd}`;

        // Find all active enrollments where dateOfBirth MM-DD matches today
        const results = await db
          .select({
            id: schema.enrollments.id,
            customerName: schema.enrollments.customerName,
            customerEmail: schema.enrollments.customerEmail,
            dateOfBirth: schema.enrollments.dateOfBirth,
            beltRank: schema.enrollments.beltRank,
            photoUrl: schema.enrollments.photoUrl,
            studentName: schema.enrollments.studentName,
          })
          .from(schema.enrollments)
          .where(
            and(
              eq(schema.enrollments.status, 'active'),
              sql`DATE_FORMAT(${schema.enrollments.dateOfBirth}, '%m-%d') = ${todayMMDD}`
            )
          );

        return results.map(e => ({
          id: e.id,
          name: e.studentName || e.customerName,
          email: e.customerEmail,
          beltRank: e.beltRank,
          photoUrl: e.photoUrl,
          age: e.dateOfBirth
            ? today.getFullYear() - parseInt((e.dateOfBirth as string).substring(0, 4))
            : null,
        }));
      }),

    // Real-time attendance log for today's kiosk check-ins
    getTodayAttendance: protectedProcedure
      .input(z.object({
        date: z.string().optional(), // YYYY-MM-DD, defaults to today
        source: z.enum(['kiosk', 'staff', 'admin', 'mobile', 'all']).optional().default('all'),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const today = new Date();
        const targetDate = input.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        // Build where conditions
        const conditions = [eq(schema.attendance.checkInDate, targetDate)];
        if (input.source && input.source !== 'all') {
          conditions.push(eq(schema.attendance.source, input.source as 'kiosk' | 'staff' | 'admin' | 'mobile'));
        }
        // Fetch attendance records for the day
        const records = await db
          .select()
          .from(schema.attendance)
          .where(and(...conditions))
          .orderBy(desc(schema.attendance.checkInTimestamp));
        // Enrich with enrollment data for student names
        const enriched = await Promise.all(records.map(async (r) => {
          let studentName = `Student #${r.studentId}`;
          let beltRank = r.beltRankAtCheckIn || 'Unknown';
          let photoUrl: string | null = null;
          let currentStreak = 0;
          if (r.enrollmentId) {
            const enrollment = await db
              .select()
              .from(schema.enrollments)
              .where(eq(schema.enrollments.id, r.enrollmentId))
              .limit(1);
            if (enrollment[0]) {
              studentName = enrollment[0].studentName || enrollment[0].customerName;
              beltRank = enrollment[0].beltRank;
              photoUrl = enrollment[0].photoUrl;
              currentStreak = enrollment[0].currentStreak;
            }
          }
          return {
            id: r.id,
            studentId: r.studentId,
            enrollmentId: r.enrollmentId,
            studentName,
            beltRank,
            photoUrl,
            currentStreak,
            programType: r.programType,
            source: r.source,
            xpAwarded: r.xpAwarded,
            checkInTimestamp: r.checkInTimestamp,
            checkInDate: r.checkInDate,
            notes: r.notes,
          };
        }));
        return {
          date: targetDate,
          total: enriched.length,
          records: enriched,
        };
      }),

    // ─── Kiosk / Day Pass Settings ────────────────────────────────────────────
    /** Get the current day pass price (in cents) */
    getDayPassPrice: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      const [row] = await db
        .select()
        .from(schema.adminConfig)
        .where(eq(schema.adminConfig.key, 'dayPassAmountCents'))
        .limit(1);
      return { amountCents: row ? parseInt(row.value) : 2000 };
    }),

    /** Set the day pass price (admin only) */
    setDayPassPrice: protectedProcedure
      .input(z.object({
        amountCents: z.number().int().min(50).max(100000),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        await db
          .insert(schema.adminConfig)
          .values({ key: 'dayPassAmountCents', value: input.amountCents.toString() })
          .onDuplicateKeyUpdate({ set: { value: input.amountCents.toString() } });
        return { success: true, amountCents: input.amountCents };
      }),
    // Get recent payment failures (admin only)
    getPaymentFailures: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const failures = await db
          .select()
          .from(schema.paymentFailures)
          .orderBy(desc(schema.paymentFailures.createdAt))
          .limit(input.limit);
        // Enrich with enrollment info
        const enriched = await Promise.all(
          failures.map(async (f) => {
            const [enrollment] = await db
              .select({
                customerName: schema.enrollments.customerName,
                customerEmail: schema.enrollments.customerEmail,
                studentName: schema.enrollments.studentName,
                membershipPackageId: schema.enrollments.membershipPackageId,
              })
              .from(schema.enrollments)
              .where(eq(schema.enrollments.id, f.enrollmentId))
              .limit(1);
            return { ...f, enrollment: enrollment ?? null };
          })
        );
        return enriched;
      }),
    // Get recent webhook events (admin only)
    getWebhookEvents: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        return db
          .select()
          .from(schema.webhookEvents)
          .orderBy(desc(schema.webhookEvents.createdAt))
          .limit(input.limit);
      }),
    // Resolve a payment failure manually (admin only)
    resolvePaymentFailure: protectedProcedure
      .input(z.object({ failureId: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const [failure] = await db
          .select()
          .from(schema.paymentFailures)
          .where(eq(schema.paymentFailures.id, input.failureId))
          .limit(1);
        if (!failure) throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment failure not found' });
        // Mark failure resolved
        await db
          .update(schema.paymentFailures)
          .set({ status: 'resolved' })
          .where(eq(schema.paymentFailures.id, input.failureId));
        // Re-activate enrollment
        await db
          .update(schema.enrollments)
          .set({ status: 'active' })
          .where(eq(schema.enrollments.id, failure.enrollmentId));
        return { success: true };
      }),

    // ─── Billing Schedule Report ──────────────────────────────────────────────
    // Get full billing schedule for all active students (admin only)
    getBillingSchedule: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      const activeEnrollments = await db
        .select()
        .from(schema.enrollments)
        .where(eq(schema.enrollments.status, 'active'))
        .orderBy(schema.enrollments.startDate);

      const FLUIDPAY_KEY = process.env.FLUIDPAY_SECRET_KEY;
      const results = [];

      for (const e of activeEnrollments) {
        let subAmount: number | null = null;
        let subStatus: string | null = null;
        let nextBillDate: string | null = null;
        let paymentMethod = 'manual';

        // Determine payment method
        if (e.fluidpaySubscriptionId) {
          paymentMethod = 'fluidpay';
          try {
            const res = await fetch(`https://app.fluidpay.com/api/recurring/subscription/${e.fluidpaySubscriptionId}`, {
              headers: { 'Authorization': FLUIDPAY_KEY || '' }
            });
            const data = await res.json();
            if (data?.data) {
              subAmount = data.data.amount ? data.data.amount / 100 : null;
              subStatus = data.data.status || null;
              nextBillDate = data.data.next_run_date || null;
            }
          } catch {
            subStatus = 'error';
          }
        } else if (e.stripeSubscriptionId) {
          paymentMethod = 'stripe';
        }

        const billingDay = e.startDate ? new Date(e.startDate).getDate() : null;

        results.push({
          id: e.id,
          studentName: e.studentName || e.customerName,
          parentName: e.customerName,
          phone: e.customerPhone,
          email: e.customerEmail,
          startDate: e.startDate,
          billingDay,
          paymentMethod,
          fluidpaySubscriptionId: e.fluidpaySubscriptionId,
          stripeSubscriptionId: e.stripeSubscriptionId,
          subAmount,
          subStatus,
          nextBillDate,
          remainingBalance: e.remainingBalance,
          monthlyPaymentsRemaining: e.monthlyPaymentsRemaining,
          isFrozen: e.isFrozen,
          downPaymentAmount: e.downPaymentAmount,
        });
      }

      return results;
    }),

    // ─── Package Management ────────────────────────────────────────────────────
    // List all membership packages (admin only)
    getPackages: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
      return db.select().from(schema.membershipPackages).orderBy(schema.membershipPackages.id);
    }),

    // Update an existing membership package (admin only)
    updatePackage: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        name: z.string().min(1).max(100).optional(),
        monthlyPrice: z.number().min(0).optional(),
        enrollmentFee: z.number().min(0).optional(),
        description: z.string().optional(),
        benefits: z.array(z.string()).optional(),
        invitationOnly: z.boolean().optional(),
        isActive: z.boolean().optional(),
        fluidpayPlanId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const [existing] = await db
          .select()
          .from(schema.membershipPackages)
          .where(eq(schema.membershipPackages.id, input.id))
          .limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Package not found' });
        const currentMonthly = parseFloat(existing.monthlyPrice as string);
        const currentEnrollment = parseFloat(existing.enrollmentFee as string);
        const newMonthly = input.monthlyPrice ?? currentMonthly;
        const newEnrollment = input.enrollmentFee ?? currentEnrollment;
        // Always auto-calculate downPayment = monthlyPrice + enrollmentFee
        const newDownPayment = newMonthly + newEnrollment;
        const updateData: Record<string, unknown> = {
          downPayment: newDownPayment.toFixed(2),
        };
        if (input.name !== undefined) updateData.name = input.name;
        if (input.monthlyPrice !== undefined) updateData.monthlyPrice = newMonthly.toFixed(2);
        if (input.enrollmentFee !== undefined) updateData.enrollmentFee = newEnrollment.toFixed(2);
        if (input.description !== undefined) updateData.description = input.description;
        if (input.benefits !== undefined) updateData.benefits = JSON.stringify(input.benefits);
        if (input.invitationOnly !== undefined) updateData.invitationOnly = input.invitationOnly ? 1 : 0;
        if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;
        if (input.fluidpayPlanId !== undefined) updateData.fluidpayPlanId = input.fluidpayPlanId || null;
        await db
          .update(schema.membershipPackages)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .set(updateData as any)
          .where(eq(schema.membershipPackages.id, input.id));
        const [updated] = await db
          .select()
          .from(schema.membershipPackages)
          .where(eq(schema.membershipPackages.id, input.id))
          .limit(1);
        return updated;
      }),

    // Create a new membership package (admin only)
    createPackage: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        monthlyPrice: z.number().min(0),
        enrollmentFee: z.number().min(0).default(99),
        description: z.string().optional(),
        benefits: z.array(z.string()).optional(),
        invitationOnly: z.boolean().default(false),
        fluidpayPlanId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const downPayment = input.monthlyPrice + input.enrollmentFee;
        const insertResult = await db.insert(schema.membershipPackages).values({
          name: input.name,
          durationMonths: 0, // month-to-month
          monthlyPrice: input.monthlyPrice.toFixed(2),
          totalPrice: '0.00',
          registrationFee: input.enrollmentFee.toFixed(2),
          downPayment: downPayment.toFixed(2),
          enrollmentFee: input.enrollmentFee.toFixed(2),
          description: input.description ?? null,
          benefits: input.benefits ? JSON.stringify(input.benefits) : null,
          invitationOnly: input.invitationOnly ? 1 : 0,
          isActive: 1,
          fluidpayPlanId: input.fluidpayPlanId ?? null,
        });
        const newId = (insertResult as unknown as { insertId: number }).insertId;
        const [created] = await db
          .select()
          .from(schema.membershipPackages)
          .where(eq(schema.membershipPackages.id, newId))
          .limit(1);
        return created;
      }),

    // Poll for the most recent Facebook lead — used by admin dashboard to show a toast when a new lead arrives
    getLatestFacebookLead: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return null;
      const [latest] = await db
        .select({
          id: schema.trialSignups.id,
          name: schema.trialSignups.name,
          phone: schema.trialSignups.phone,
          program: schema.trialSignups.program,
          createdAt: schema.trialSignups.createdAt,
        })
        .from(schema.trialSignups)
        .where(eq(schema.trialSignups.source, "facebook"))
        .orderBy(desc(schema.trialSignups.createdAt))
        .limit(1);
      return latest ?? null;
    }),

    // ─── Active Now ─────────────────────────────────────────────────────────────
    // Returns the count of unique members checked in today (CST) plus the last
    // 5 check-in names so the sidebar can show a live pulse.
    getActiveNow: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

      // Today's date string in CST (YYYY-MM-DD)
      const nowCST = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
      const todayStr = `${nowCST.getFullYear()}-${String(nowCST.getMonth() + 1).padStart(2, '0')}-${String(nowCST.getDate()).padStart(2, '0')}`;

      // Count unique students checked in today
      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${schema.attendance.studentId})` })
        .from(schema.attendance)
        .where(eq(schema.attendance.checkInDate, todayStr));

      // Fetch the last 5 check-ins with student names for the tooltip
      const recent = await db
        .select({
          studentId: schema.attendance.studentId,
          checkInTimestamp: schema.attendance.checkInTimestamp,
          studentName: schema.enrollments.studentName,
          customerName: schema.enrollments.customerName,
        })
        .from(schema.attendance)
        .leftJoin(
          schema.enrollments,
          eq(schema.attendance.studentId, schema.enrollments.id)
        )
        .where(eq(schema.attendance.checkInDate, todayStr))
        .orderBy(desc(schema.attendance.checkInTimestamp))
        .limit(5);

      return {
        count: Number(count),
        recentNames: recent.map(r => r.studentName ?? r.customerName ?? 'Member'),
        asOf: new Date().toISOString(),
      };
    }),
  }),
  // ─── Lead Magnet ───────────────────────────────────────────────────────────────
  leadMagnet: router({
    submit: publicProcedure
      .input(z.object({
        email: z.string().email(),
        name: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        // Check for duplicate email
        const existing = await db
          .select()
          .from(schema.leadMagnetLeads)
          .where(eq(schema.leadMagnetLeads.email, input.email.toLowerCase()))
          .limit(1);

        if (existing.length > 0) {
          return { success: true, alreadySubscribed: true };
        }

        // Save lead
        await db.insert(schema.leadMagnetLeads).values({
          email: input.email.toLowerCase(),
          name: input.name ?? null,
          phone: input.phone ?? null,
          source: 'popup',
          guideTitle: '5 Self-Defense Moves Every Parent Should Teach Their Child',
          emailSent: false,
        });

        // Send guide email via Resend
        let emailSent = false;
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(ENV.RESEND_API_KEY);
          const firstName = input.name ? input.name.split(' ')[0] : 'there';
          await resend.emails.send({
            from: ENV.EMAIL_FROM,
            to: input.email,
            subject: '🥋 Your Free Guide: 5 Self-Defense Moves Every Parent Should Teach Their Child',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
                <div style="background: #000000; padding: 24px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">MYDOJO</h1>
                  <p style="color: #CC0000; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px;">MARTIAL ARTS &amp; FITNESS</p>
                </div>
                <div style="padding: 32px 24px;">
                  <h2 style="color: #111; font-size: 22px;">Hi ${firstName}! 👋</h2>
                  <p style="color: #444; line-height: 1.6;">Thank you for your interest in MyDojo! Here is your free guide:</p>
                  <div style="background: #f9f9f9; border-left: 4px solid #CC0000; padding: 20px; margin: 24px 0; border-radius: 4px;">
                    <h3 style="color: #CC0000; margin: 0 0 16px; font-size: 18px;">🥋 5 Self-Defense Moves Every Parent Should Teach Their Child</h3>
                    <ol style="color: #333; line-height: 2; padding-left: 20px;">
                      <li><strong>The Wrist Release</strong> — Rotate toward the thumb side of the grip and pull sharply to break even a strong adult's hold.</li>
                      <li><strong>The Palm Strike</strong> — A palm-heel strike to the nose or chin is safer than a closed fist and just as effective.</li>
                      <li><strong>The Stomp &amp; Run</strong> — Stomp hard on the attacker's foot, then run and yell "STRANGER!" — bystanders respond faster to specific words.</li>
                      <li><strong>The Bear Hug Escape</strong> — Drop body weight suddenly, tuck chin, and drive elbows back hard into the attacker's ribs.</li>
                      <li><strong>The Verbal Boundary</strong> — A loud, confident "NO!" and direct eye contact. Teach kids that their voice is a weapon.</li>
                    </ol>
                  </div>
                  <p style="color: #444; line-height: 1.6;">These moves are taught in our <strong>Little Ninjas</strong> and <strong>Dragon Kids</strong> programs every week.</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="https://mydojoma.com" style="background: #CC0000; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; letter-spacing: 1px; display: inline-block;">BOOK A FREE TRIAL CLASS →</a>
                  </div>
                  <p style="color: #888; font-size: 13px;">Questions? Call us at <a href="tel:+18774693656" style="color: #CC0000;">(877) 4-MYDOJO</a> or visit us at 11721 Spring Cypress Rd, Tomball, TX 77377.</p>
                </div>
                <div style="background: #111; padding: 16px; text-align: center;">
                  <p style="color: #666; font-size: 12px; margin: 0;">© 2025 MyDojo Martial Arts &amp; Fitness · Tomball, TX</p>
                </div>
              </div>
            `,
          });
          emailSent = true;
        } catch (err) {
          console.error('[LeadMagnet] Failed to send guide email:', err);
        }

        if (emailSent) {
          await db
            .update(schema.leadMagnetLeads)
            .set({ emailSent: true })
            .where(eq(schema.leadMagnetLeads.email, input.email.toLowerCase()));
        }

        // Mirror to trialSignups so lead appears in admin dashboard
        try {
          const emailLowerMirror = input.email.toLowerCase();
          const existingMirror = await db
            .select({ id: schema.trialSignups.id })
            .from(schema.trialSignups)
            .where(
              and(
                eq(schema.trialSignups.email, emailLowerMirror),
                eq(schema.trialSignups.source, 'lead_magnet')
              )
            )
            .limit(1);

          if (existingMirror.length === 0) {
            await db.insert(schema.trialSignups).values({
              name: input.name ?? 'Unknown',
              email: emailLowerMirror,
              phone: input.phone ?? '',
              program: 'Not Sure',
              location: 'Tomball HQ',
              preferredContactMethod: 'email',
              status: 'new',
              source: 'lead_magnet',
              pipelineStage: 'new_lead',
              dojoFlowSyncStatus: 'pending',
              dojoFlowSyncAttempts: 0,
              introCountRequired: 0,
              introCountBooked: 0,
              introCountCompleted: 0,
            });
          }
        } catch (mirrorErr) {
          console.error('[LeadMagnet] Failed to mirror lead to trialSignups:', mirrorErr);
        }

        // Notify owner
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: '📧 New Lead Magnet Signup',
            content: `${input.name ?? 'Someone'} (${input.email}${input.phone ? ` · ${input.phone}` : ''}) just downloaded the free self-defense guide.`,
          });
        } catch (_) {}

         return { success: true, alreadySubscribed: false };
      }),
  }),

  // ─── Website Popup Lead Capture ─────────────────────────────────────────────
  popup: router({
    submitLead: publicProcedure
      .input(z.object({
        campaign: z.enum(['summer_camp', 'kickboxing', 'online_special']),
        name: z.string().min(1).max(255).optional(),
        email: z.string().email(),
        phone: z.string().max(30).optional(),
        program: z.string().max(100).optional(),
        source: z.string().max(100).optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const emailLower = input.email.toLowerCase();

        // Dedup: same email + same campaign
        const existing = await db
          .select()
          .from(schema.popupLeads)
          .where(
            and(
              eq(schema.popupLeads.email, emailLower),
              eq(schema.popupLeads.campaign, input.campaign)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          return { success: true, alreadySubmitted: true };
        }

        // Insert lead
        await db.insert(schema.popupLeads).values({
          campaign: input.campaign,
          name: input.name ?? null,
          email: emailLower,
          phone: input.phone ?? null,
          source: input.source ?? 'popup',
          emailSent: false,
        });

        // Send welcome SMS to the prospect (fire-and-forget)
        if (input.phone) {
          try {
            const { sendSms, normalizePhone } = await import('./sms800');
            const firstName = input.name ? input.name.split(' ')[0] : 'there';
            const isOnlineSpecialSms = input.campaign === 'online_special';
            const smsMessage = isOnlineSpecialSms
              ? `Hi ${firstName}! 🎉 Welcome to MyDojo! Your 2 FREE weeks of karate classes are confirmed. We're at 11721 Spring Cypress Rd, Tomball TX. Arrive 10-15 min early for your first class & wear comfy clothes — we'll handle the rest! Questions? Call/text (877) 4-MYDOJO. See you on the mat! 🥋`
              : `Hi ${firstName}! Thanks for your interest in MyDojo. We'll be in touch soon to schedule your free class. Questions? Call (877) 4-MYDOJO. 🥋`;
            await sendSms({
              to: normalizePhone(input.phone),
              message: smsMessage,
            });
          } catch (smsErr) {
            console.error('[Popup Lead] Failed to send welcome SMS to prospect:', smsErr);
          }
        }

        // Send confirmation email to the lead
        let emailSent = false;
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(ENV.RESEND_API_KEY);
          const firstName = input.name ? input.name.split(' ')[0] : 'there';

          const isSummerCamp = input.campaign === 'summer_camp';
          const isOnlineSpecial = input.campaign === 'online_special';
          const subject = isSummerCamp
            ? `🏕️ You're on the Summer Camp Interest List — MyDojo`
            : isOnlineSpecial
            ? `🎉 Your 2 FREE Weeks Are Confirmed — MyDojo`
            : `🥊 You're on the Kickboxing Interest List — MyDojo`;

          const bodyHtml = isOnlineSpecial
            ? `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                <div style="background:#000;padding:24px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">MYDOJO</h1>
                  <p style="color:#CC0000;margin:4px 0 0;font-size:12px;letter-spacing:1px;">ONLINE SPECIAL — 2 WEEKS FREE</p>
                </div>
                <div style="padding:32px 24px;">
                  <h2 style="color:#111;font-size:22px;">Hi ${firstName}! 🎉</h2>
                  <p style="color:#444;line-height:1.6;">Congratulations — your <strong>2 FREE weeks of karate classes</strong> at MyDojo are confirmed! We can't wait to have you on the mat.</p>

                  <div style="background:#fef2f2;border-left:4px solid #CC0000;padding:20px;margin:24px 0;border-radius:4px;">
                    <h3 style="color:#CC0000;margin:0 0 12px;font-size:17px;">📍 We're Located At</h3>
                    <p style="color:#333;margin:0;line-height:1.8;"><strong>MyDojo Martial Arts &amp; Fitness</strong><br/>11721 Spring Cypress Rd, Tomball, TX 77377<br/><a href="https://maps.google.com/?q=11721+Spring+Cypress+Rd+Tomball+TX+77377" style="color:#CC0000;">Get Directions →</a></p>
                  </div>

                  <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:20px;margin:24px 0;border-radius:4px;">
                    <h3 style="color:#15803d;margin:0 0 12px;font-size:17px;">🥋 What to Expect on Your First Class</h3>
                    <ul style="color:#333;line-height:2;padding-left:20px;">
                      <li>Arrive <strong>10–15 minutes early</strong> to check in and meet your instructor</li>
                      <li>Wear comfortable workout clothes — we'll provide a uniform for your trial</li>
                      <li>No prior experience needed — all skill levels are welcome</li>
                      <li>Classes are <strong>45–60 minutes</strong> of fun, structured training</li>
                      <li>You'll learn basic stances, strikes, and self-defense techniques</li>
                      <li>Bring water and a positive attitude — that's all you need!</li>
                    </ul>
                  </div>

                  <div style="background:#f8f9fa;padding:20px;margin:24px 0;border-radius:4px;">
                    <h3 style="color:#111;margin:0 0 16px;font-size:17px;">❓ Frequently Asked Questions</h3>
                    <p style="color:#333;margin:0 0 8px;"><strong>Q: What age groups do you teach?</strong><br/><span style="color:#555;">A: We have programs for all ages — Little Ninjas (3–5), Dragon Kids (5–12), Teens &amp; Adults (13+), and Kickboxing for all ages.</span></p>
                    <p style="color:#333;margin:16px 0 8px;"><strong>Q: Do I need to buy a uniform?</strong><br/><span style="color:#555;">A: Not for your trial! We'll provide everything you need for your first two weeks. Uniforms are available if you decide to enroll.</span></p>
                    <p style="color:#333;margin:16px 0 8px;"><strong>Q: How many classes can I attend during my 2 free weeks?</strong><br/><span style="color:#555;">A: You can attend as many classes as you'd like during your 2-week trial. We recommend at least 2 classes per week for the best experience.</span></p>
                    <p style="color:#333;margin:16px 0 8px;"><strong>Q: Is there a contract or commitment?</strong><br/><span style="color:#555;">A: Absolutely not for the trial. If you love it and decide to enroll, we offer flexible month-to-month and annual plans.</span></p>
                    <p style="color:#333;margin:16px 0 8px;"><strong>Q: What if I need to reschedule my first class?</strong><br/><span style="color:#555;">A: No problem! Just call or text us at <a href="tel:+18774693656" style="color:#CC0000;">(877) 4-MYDOJO</a> and we'll find a time that works for you.</span></p>
                  </div>

                  <div style="text-align:center;margin:32px 0;">
                    <a href="https://mydojoma.com/programs" style="background:#CC0000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:16px;letter-spacing:1px;display:inline-block;">VIEW CLASS SCHEDULE →</a>
                  </div>
                  <p style="color:#444;line-height:1.6;">Questions? Call or text us at <a href="tel:+18774693656" style="color:#CC0000;">(877) 4-MYDOJO</a> — we're happy to help!</p>
                  <p style="color:#888;font-size:13px;">11721 Spring Cypress Rd, Tomball, TX 77377 · <a href="https://mydojoma.com" style="color:#CC0000;">mydojoma.com</a></p>
                </div>
                <div style="background:#111;padding:16px;text-align:center;">
                  <p style="color:#666;font-size:12px;margin:0;">© 2025 MyDojo Martial Arts &amp; Fitness · Tomball, TX</p>
                </div>
              </div>`
            : isSummerCamp
            ? `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                <div style="background:#000;padding:24px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">MYDOJO</h1>
                  <p style="color:#CC0000;margin:4px 0 0;font-size:12px;letter-spacing:1px;">SUMMER CAMP 2025</p>
                </div>
                <div style="padding:32px 24px;">
                  <h2 style="color:#111;font-size:22px;">Hi ${firstName}! 🏕️</h2>
                  <p style="color:#444;line-height:1.6;">Thank you for your interest in <strong>MyDojo Summer Camp 2025</strong>! You're now on our early-access list.</p>
                  <div style="background:#fef9c3;border-left:4px solid #eab308;padding:20px;margin:24px 0;border-radius:4px;">
                    <h3 style="color:#92400e;margin:0 0 12px;font-size:17px;">🌟 What to Expect</h3>
                    <ul style="color:#333;line-height:2;padding-left:20px;">
                      <li>Martial arts training, fitness games & team challenges</li>
                      <li>Ages 5–14 welcome — all skill levels</li>
                      <li>Full-day & half-day options available</li>
                      <li>Certified instructors & safe, supervised environment</li>
                      <li>Early-bird pricing for interest list members</li>
                    </ul>
                  </div>
                  <p style="color:#444;line-height:1.6;">We'll reach out as soon as registration opens with your exclusive early-bird discount. In the meantime, feel free to call us at <a href="tel:+18774693656" style="color:#CC0000;">(877) 4-MYDOJO</a>.</p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="https://mydojoma.com/summer-camp" style="background:#CC0000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:16px;letter-spacing:1px;display:inline-block;">LEARN MORE ABOUT SUMMER CAMP →</a>
                  </div>
                  <p style="color:#888;font-size:13px;">11721 Spring Cypress Rd, Tomball, TX 77377 · <a href="https://mydojoma.com" style="color:#CC0000;">mydojoma.com</a></p>
                </div>
                <div style="background:#111;padding:16px;text-align:center;">
                  <p style="color:#666;font-size:12px;margin:0;">© 2025 MyDojo Martial Arts &amp; Fitness · Tomball, TX</p>
                </div>
              </div>`
            : `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">
                <div style="background:#000;padding:24px;text-align:center;">
                  <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px;">MYDOJO</h1>
                  <p style="color:#CC0000;margin:4px 0 0;font-size:12px;letter-spacing:1px;">KICKBOXING CLASSES</p>
                </div>
                <div style="padding:32px 24px;">
                  <h2 style="color:#111;font-size:22px;">Hi ${firstName}! 🥊</h2>
                  <p style="color:#444;line-height:1.6;">You're on the list for a <strong>FREE Kickboxing Trial Class</strong> at MyDojo!</p>
                  <div style="background:#fef2f2;border-left:4px solid #CC0000;padding:20px;margin:24px 0;border-radius:4px;">
                    <h3 style="color:#CC0000;margin:0 0 12px;font-size:17px;">🔥 Why You'll Love It</h3>
                    <ul style="color:#333;line-height:2;padding-left:20px;">
                      <li>Burn up to 800 calories in a single 45-minute session</li>
                      <li>Real martial arts technique — not just cardio</li>
                      <li>All fitness levels welcome — no experience needed</li>
                      <li>Certified instructors in a high-energy, supportive environment</li>
                      <li>First class is completely FREE</li>
                    </ul>
                  </div>
                  <p style="color:#444;line-height:1.6;">Our team will reach out to schedule your free trial. Can't wait? Call us directly at <a href="tel:+18774693656" style="color:#CC0000;">(877) 4-MYDOJO</a>.</p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="https://mydojoma.com/programs/kickboxing" style="background:#CC0000;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold;font-size:16px;letter-spacing:1px;display:inline-block;">BOOK MY FREE CLASS NOW →</a>
                  </div>
                  <p style="color:#888;font-size:13px;">11721 Spring Cypress Rd, Tomball, TX 77377 · <a href="https://mydojoma.com" style="color:#CC0000;">mydojoma.com</a></p>
                </div>
                <div style="background:#111;padding:16px;text-align:center;">
                  <p style="color:#666;font-size:12px;margin:0;">© 2025 MyDojo Martial Arts &amp; Fitness · Tomball, TX</p>
                </div>
              </div>`;

          await resend.emails.send({
            from: `MyDojo <${ENV.EMAIL_FROM}>`,
            to: input.email,
            subject,
            html: bodyHtml,
          });
          emailSent = true;
        } catch (err) {
          console.error('[Popup Lead] Failed to send confirmation email:', err);
        }

        if (emailSent) {
          await db
            .update(schema.popupLeads)
            .set({ emailSent: true })
            .where(
              and(
                eq(schema.popupLeads.email, emailLower),
                eq(schema.popupLeads.campaign, input.campaign)
              )
            );
        }

        // Also insert into trialSignups so popup leads appear in the admin dashboard
        try {
          const programMap: Record<string, 'Kickboxing' | 'Summer Camp' | 'Not Sure'> = {
            kickboxing: 'Kickboxing',
            summer_camp: 'Summer Camp',
          };
          const mappedProgram = programMap[input.campaign] ?? 'Not Sure';

          // Check for duplicate in trialSignups (same email + same campaign source)
          const campaignSource = `popup_${input.campaign}`;
          const existingTrialSignup = await db
            .select({ id: schema.trialSignups.id })
            .from(schema.trialSignups)
            .where(
              and(
                eq(schema.trialSignups.email, emailLower),
                eq(schema.trialSignups.source, campaignSource)
              )
            )
            .limit(1);

          if (existingTrialSignup.length === 0) {
            await db.insert(schema.trialSignups).values({
              name: input.name ?? 'Unknown',
              email: emailLower,
              phone: input.phone ?? '',
              program: mappedProgram,
              location: 'Tomball HQ',
              preferredContactMethod: 'email',
              status: 'new',
              source: `popup_${input.campaign}`,
              pipelineStage: 'new_lead',
              dojoFlowSyncStatus: 'pending',
              dojoFlowSyncAttempts: 0,
              introCountRequired: 0,
              introCountBooked: 0,
              introCountCompleted: 0,
            });
          }
        } catch (trialErr) {
          console.error('[Popup Lead] Failed to mirror lead to trialSignups:', trialErr);
          // Non-fatal — popup lead is already saved in popupLeads
        }

        // Notify staff via SMS (fire-and-forget)
        try {
          const { notifyStaffNewLead } = await import('./notifyStaffNewLead');
          const campaignLabel = input.campaign === 'summer_camp' ? 'Summer Camp' : input.campaign === 'online_special' ? 'Online Special (2 Weeks Free)' : 'Kickboxing';
          notifyStaffNewLead({
            name: input.name ?? 'Unknown',
            phone: input.phone,
            program: input.program ?? campaignLabel,
            source: `popup_${input.campaign}`,
          }).catch(() => {});
        } catch (_) {}

        // Notify owner
        try {
          const { notifyOwner } = await import('./_core/notification');
          const campaignLabel = input.campaign === 'summer_camp' ? '🏕️ Summer Camp' : input.campaign === 'online_special' ? '🎁 Online Special' : '🥊 Kickboxing';
          await notifyOwner({
            title: `New ${campaignLabel} Lead`,
            content: `${input.name ?? 'Someone'} (${input.email}${input.phone ? ` · ${input.phone}` : ''}) signed up via the ${campaignLabel} popup.`,
          });
        } catch (_) {}

        return { success: true, alreadySubmitted: false };
      }),

    // Admin: list all popup leads
    getLeads: protectedProcedure
      .input(z.object({
        campaign: z.enum(['summer_camp', 'kickboxing', 'all']).optional(),
        limit: z.number().min(1).max(500).optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const conditions = [];
        if (input.campaign && input.campaign !== 'all') {
          conditions.push(eq(schema.popupLeads.campaign, input.campaign));
        }

        const leads = await db
          .select()
          .from(schema.popupLeads)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.popupLeads.createdAt))
          .limit(input.limit ?? 200);
        return leads;
      }),

    // ── $29 Intro Offer — Stripe Checkout Session ─────────────────────────────
    createIntroOfferCheckout: publicProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        program: z.string().min(1),
        origin: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const stripeKey = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
        if (!stripeKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe not configured' });

        const stripeClient = new Stripe(stripeKey, { apiVersion: '2026-01-28.clover' as any });

        const baseUrl = input.origin || 'https://mydojoma.com';

        // Save the lead (dedup by email + campaign)
        try {
          const emailLower = input.email.toLowerCase();
          const existing = await db
            .select()
            .from(schema.popupLeads)
            .where(and(eq(schema.popupLeads.email, emailLower), eq(schema.popupLeads.campaign, 'online_special')))
            .limit(1);
          if (existing.length === 0) {
            await db.insert(schema.popupLeads).values({
              campaign: 'online_special',
              name: input.name,
              email: emailLower,
              phone: input.phone ?? null,
              source: 'intro_offer_popup',
              emailSent: false,
            });
          }
        } catch (leadErr) {
          console.error('[IntroOffer] Failed to save popup lead:', leadErr);
        }

        // Determine program type
        const isKickboxing = input.program.toLowerCase().includes('kickboxing');
        const isSummerCampOffer = input.program.toLowerCase().includes('summer camp') || input.program.toLowerCase().includes('summer_camp');
        // For free kickboxing, skip Stripe and create trial signup directly
        if (isKickboxing) {
          try {
            await db.insert(schema.trialSignups).values({
              name: input.name,
              email: input.email,
              phone: input.phone || '',
              program: 'Kickboxing',
              status: 'new',
              source: 'intro_offer_popup',
              location: 'HQ',
            } as any);
          } catch (err) {
            console.error('[IntroOffer] Failed to create kickboxing trial signup:', err);
          }
          return { checkoutUrl: null, isFree: true };
        }

        // Summer Camp: $49 for 3-day pass, first-time participants only
        if (isSummerCampOffer) {
          const emailLower = input.email.toLowerCase();
          try {
            const priorCamp = await db
              .select()
              .from(schema.trialSignups)
              .where(and(
                eq(schema.trialSignups.email, emailLower),
                eq(schema.trialSignups.program, 'Summer Camp'),
                eq(schema.trialSignups.status, 'completed')
              ))
              .limit(1);
            if (priorCamp.length > 0) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'This offer is only valid for first-time Summer Camp participants. Please contact us for regular pricing.',
              });
            }
          } catch (err) {
            if (err instanceof TRPCError) throw err;
            console.error('[IntroOffer] Summer camp first-time check error:', err);
          }
          const campSession = await stripeClient.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
              price_data: {
                currency: 'usd',
                unit_amount: 4900,
                product_data: {
                  name: 'MyDojo Summer Camp — 3-Day Pass',
                  description: '3 days of martial arts summer camp. First-time participants only. Ages 5–14.',
                },
              },
              quantity: 1,
            }],
            customer_email: input.email,
            allow_promotion_codes: true,
            success_url: `${baseUrl}/intro-offer-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(input.name)}&program=${encodeURIComponent('Summer Camp')}`,
            cancel_url: `${baseUrl}/summer-camp?offer=cancelled`,
            metadata: {
              type: 'summer_camp_intro',
              customerName: input.name,
              customerEmail: input.email,
              customerPhone: input.phone || '',
              program: 'Summer Camp',
            },
            client_reference_id: input.email,
          });
          return { checkoutUrl: campSession.url, isFree: false };
        }
        // Create Stripe Checkout session for $29 paid offer
        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: 2900,
              product_data: {
                name: `MyDojo ${input.program} — 2 Classes + Uniform`,
                description: '2 martial arts classes + uniform included. Valid for 30 days.',
              },
            },
            quantity: 1,
          }],
          customer_email: input.email,
          allow_promotion_codes: true,
          success_url: `${baseUrl}/intro-offer-success?session_id={CHECKOUT_SESSION_ID}&name=${encodeURIComponent(input.name)}&program=${encodeURIComponent(input.program)}`,
          cancel_url: `${baseUrl}/?offer=cancelled`,
          metadata: {
            type: 'intro_offer',
            customerName: input.name,
            customerEmail: input.email,
            customerPhone: input.phone || '',
            program: input.program,
          },
          client_reference_id: input.email,
        });

        return { checkoutUrl: session.url, isFree: false };
      }),

    // ── Summer Camp Pass — Direct Stripe Checkout (no form required) ─────────────
    createSummerCampCheckout: publicProcedure
      .input(z.object({
        origin: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const stripeKey = process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '';
        if (!stripeKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Stripe not configured' });

        const stripeClient = new Stripe(stripeKey, { apiVersion: '2026-01-28.clover' as any });
        const baseUrl = input.origin || 'https://mydojoma.com';

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              unit_amount: 4900,
              product_data: {
                name: 'MyDojo Summer Camp — Summer Pass',
                description: 'Full summer camp access. Ages 5–14. Includes all theme weeks, martial arts training, games, and activities.',
              },
            },
            quantity: 1,
          }],
          allow_promotion_codes: true,
          success_url: `${baseUrl}/summer-camp?checkout=success`,
          cancel_url: `${baseUrl}/summer-camp?checkout=cancelled`,
          metadata: {
            type: 'summer_camp_pass',
            program: 'Summer Camp',
          },
        });

        return { checkoutUrl: session.url };
      }),

    // ─── Summer Camp Enrollment Checkout ────────────────────────────────────────
    // Builds a Stripe Checkout session with correct per-week, per-student pricing.
    createSummerCampEnrollCheckout: publicProcedure
      .input(z.object({
        token: z.string().min(1),           // FluidPay tokenizer token
        weeks: z.array(z.string()).min(1),
        students: z.array(z.object({ name: z.string(), age: z.number(), dob: z.string().optional() })).min(1),
        parentName: z.string().min(1),
        parentEmail: z.string().email(),
        parentPhone: z.string().min(7),
        isFullSummer: z.boolean(),
        totalCents: z.number().int().positive(),
      }))
      .mutation(async ({ input }) => {
        const fluidPayKey = process.env.FLUIDPAY_SECRET_KEY;
        if (!fluidPayKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment processor not configured' });

        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });

        const weeksCount = input.weeks.length;
        const studentCount = input.students.length;
        const studentsList = input.students.map(s => `${s.name} (age ${s.age}${s.dob ? ', DOB ' + s.dob : ''})`).join(', ');
        const weeksList = input.weeks.join(', ');

        // Charge via FluidPay REST API
        const chargeRes = await fetch('https://app.fluidpay.com/api/transaction', {
          method: 'POST',
          headers: { 'Authorization': fluidPayKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'sale',
            amount: input.totalCents,
            payment_method: { token: input.token },
            billing_address: {
              first_name: input.parentName.split(' ')[0],
              last_name: input.parentName.split(' ').slice(1).join(' ') || '',
              email: input.parentEmail,
              phone: input.parentPhone,
            },
            order_id: `camp-${Date.now()}`,
            description: `MyDojo Summer Camp 2025 — ${studentCount} student${studentCount !== 1 ? 's' : ''}, ${weeksCount} week${weeksCount !== 1 ? 's' : ''}`,
          }),
        });

        const chargeBody = await chargeRes.json() as {
          status: string;
          msg: string;
          data?: { id: string; status: string; response_body?: { card?: { response_text?: string } } };
        };

        if (chargeBody.status !== 'success' || !chargeBody.data) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: chargeBody.msg || 'Payment failed' });
        }
        const txn = chargeBody.data;
        if (txn.status !== 'approved') {
          const declineMsg = txn.response_body?.card?.response_text || `Transaction ${txn.status}`;
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Payment declined: ${declineMsg}` });
        }

        // Record enrollment
        await db.insert(schema.summerCampEnrollments).values({
          parentName: input.parentName,
          parentEmail: input.parentEmail,
          parentPhone: input.parentPhone,
          students: JSON.stringify(input.students),
          weeks: JSON.stringify(input.weeks),
          weekCount: weeksCount,
          studentCount,
          isFullSummer: input.isFullSummer ? 1 : 0,
          amountCents: input.totalCents,
          fpTransactionId: txn.id,
          status: 'approved',
        } as any);

        // Notify owner
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: `🏕️ New Summer Camp Enrollment — ${input.parentName}`,
            content: `${input.parentName} (${input.parentEmail}, ${input.parentPhone}) enrolled ${studentCount} student${studentCount !== 1 ? 's' : ''} for ${weeksCount} week${weeksCount !== 1 ? 's' : ''}${input.isFullSummer ? ' (Full Summer!)' : ''}. Total: $${(input.totalCents / 100).toFixed(2)}. Students: ${studentsList}. Weeks: ${weeksList}. FP Txn: ${txn.id}`,
          });
        } catch {}

        // Send confirmation SMS to parent
        try {
          const { sendSms } = await import('./sms800');
          const firstName = input.parentName.split(' ')[0];
          const studentNames = input.students.map(s => s.name).join(' & ');
          const weeksLabel = input.isFullSummer ? 'the Full Summer (all 10 weeks)' : `${weeksCount} week${weeksCount !== 1 ? 's' : ''}`;
          const amountFormatted = `$${(input.totalCents / 100).toFixed(2)}`;
          const confirmMsg = `🏕️ Hi ${firstName}! Your MyDojo Summer Camp enrollment is CONFIRMED! 🎉\n\n` +
            `👦 Student${studentCount !== 1 ? 's' : ''}: ${studentNames}\n` +
            `📅 Enrolled for: ${weeksLabel}\n` +
            `💳 Total charged: ${amountFormatted}\n\n` +
            `We can't wait to see ${studentCount !== 1 ? 'them' : 'them'} at camp! Questions? Call us at (877) 4-MYDOJO. 🥋`;
          await sendSms({ to: input.parentPhone, message: confirmMsg });
        } catch (smsErr) {
          // Non-fatal — enrollment already recorded, just log
          console.error('[CampEnroll] Confirmation SMS failed:', smsErr);
        }

        return { success: true, transactionId: txn.id, amountCharged: input.totalCents };
      }),

    // ─── Visitor SMS Trigger ──────────────────────────────────────────────────
    // Called on page load when ?phone= is present in the URL.
    // Sends an immediate personalized welcome text and deduplicates by phone.
    triggerVisitorSms: publicProcedure
      .input(z.object({
        phone: z.string().min(7).max(30),
        name: z.string().max(255).optional(),
        source: z.string().max(100).optional(),
        page: z.string().max(100).optional(), // e.g. 'home', 'summer-camp'
      }))
      .mutation(async ({ input }) => {
        const { sendSms, normalizePhone } = await import('./sms800');
        const normalizedPhone = normalizePhone(input.phone);
        const source = input.source ?? 'direct';
        const db = await getDb();

        if (db) {
          // Dedup: only send once per phone number (ever)
          const existing = await db
            .select({ id: schema.visitorSmsSent.id })
            .from(schema.visitorSmsSent)
            .where(eq(schema.visitorSmsSent.phone, normalizedPhone))
            .limit(1);

          if (existing.length > 0) {
            return { success: true, alreadySent: true };
          }

          // Record before sending so concurrent requests don't double-fire
          await db.insert(schema.visitorSmsSent).values({
            phone: normalizedPhone,
            source,
            name: input.name ?? null,
          });
        }

        const firstName = input.name ? input.name.split(' ')[0] : null;
        const greeting = firstName ? `Hi ${firstName}!` : 'Hey there!';
        const isSummerCamp = input.page === 'summer-camp';

        const message = isSummerCamp
          ? `${greeting} 👋 We saw you just checked out MyDojo Summer Camp! 🏕️ Spots are filling fast — 3 days for only $49. Ready to secure your child's spot? Reply YES or call (877) 4-MYDOJO and we'll get you set up! 🥋`
          : `${greeting} 👋 Thanks for visiting MyDojo! We'd love to have you try a FREE class — no experience needed. Reply YES or call (877) 4-MYDOJO to get started. See you on the mat! 🥋`;

        const result = await sendSms({ to: normalizedPhone, message });
        return { success: result.success, alreadySent: false, error: result.error };
      }),
  }),
  // ─── Commissionsns ─────────────────────────────────────────────────────────────
  commissions: router({

    // Get the current enrollment commission bonus amount (cents)
    getBonusAmount: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const [row] = await db
        .select()
        .from(schema.adminConfig)
        .where(eq(schema.adminConfig.key, 'enrollmentBonusCents'))
        .limit(1);
      return { bonusAmountCents: row ? parseInt(row.value) : 5000 }; // default $50
    }),

    // Set the enrollment commission bonus amount (admin only)
    setBonusAmount: protectedProcedure
      .input(z.object({ bonusAmountCents: z.number().int().min(0).max(100000) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .insert(schema.adminConfig)
          .values({ key: 'enrollmentBonusCents', value: input.bonusAmountCents.toString() })
          .onDuplicateKeyUpdate({ set: { value: input.bonusAmountCents.toString() } });
        return { success: true, bonusAmountCents: input.bonusAmountCents };
      }),

    // Assign a lead to a staff member
    assignLead: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        staffUserId: z.number().nullable(), // null = unassign
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        if (input.staffUserId === null) {
          // Unassign
          await db
            .update(schema.trialSignups)
            .set({ assignedStaffId: null, assignedStaffName: null, assignedAt: null })
            .where(eq(schema.trialSignups.id, input.leadId));
          return { success: true };
        }

        // Look up the staff user
        const [staffUser] = await db
          .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
          .from(schema.users)
          .where(eq(schema.users.id, input.staffUserId))
          .limit(1);
        if (!staffUser) throw new TRPCError({ code: 'NOT_FOUND', message: 'Staff member not found' });
        if (staffUser.role !== 'staff' && staffUser.role !== 'admin') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is not a staff member' });
        }

        await db
          .update(schema.trialSignups)
          .set({
            assignedStaffId: staffUser.id,
            assignedStaffName: staffUser.name,
            assignedAt: new Date(),
          })
          .where(eq(schema.trialSignups.id, input.leadId));

        return { success: true, assignedTo: staffUser.name };
      }),

    // Trigger commission when a lead is enrolled (called when pipelineStage → 'enrolled')
    triggerEnrollmentCommission: protectedProcedure
      .input(z.object({ leadId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        // Get the lead
        const [lead] = await db
          .select()
          .from(schema.trialSignups)
          .where(eq(schema.trialSignups.id, input.leadId))
          .limit(1);
        if (!lead) throw new TRPCError({ code: 'NOT_FOUND', message: 'Lead not found' });

        // Only create commission if lead has an assigned staff member
        if (!lead.assignedStaffId || !lead.assignedStaffName) {
          return { success: true, commissionCreated: false, reason: 'No staff assigned to this lead' };
        }

        // Check if a commission already exists for this lead
        const existing = await db
          .select({ id: schema.commissions.id })
          .from(schema.commissions)
          .where(eq(schema.commissions.leadId, input.leadId))
          .limit(1);
        if (existing.length > 0) {
          return { success: true, commissionCreated: false, reason: 'Commission already exists for this lead' };
        }

        // Get the current bonus amount
        const [bonusRow] = await db
          .select()
          .from(schema.adminConfig)
          .where(eq(schema.adminConfig.key, 'enrollmentBonusCents'))
          .limit(1);
        const bonusAmountCents = bonusRow ? parseInt(bonusRow.value) : 5000;

        // Create the commission record
        await db.insert(schema.commissions).values({
          staffUserId: lead.assignedStaffId,
          staffName: lead.assignedStaffName,
          leadId: lead.id,
          leadName: lead.name,
          program: lead.program,
          bonusAmountCents,
          status: 'pending',
        });

        return { success: true, commissionCreated: true, bonusAmountCents };
      }),

    // List all commissions (admin: all; staff: own only)
    listCommissions: protectedProcedure
      .input(z.object({
        staffUserId: z.number().optional(),
        status: z.enum(['pending', 'paid', 'voided', 'all']).optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const conditions = [];
        // Staff can only see their own commissions
        if (ctx.user.role === 'staff') {
          conditions.push(eq(schema.commissions.staffUserId, ctx.user.id));
        } else if (input?.staffUserId) {
          conditions.push(eq(schema.commissions.staffUserId, input.staffUserId));
        }
        if (input?.status && input.status !== 'all') {
          conditions.push(eq(schema.commissions.status, input.status as 'pending' | 'paid' | 'voided'));
        }

        const rows = await db
          .select()
          .from(schema.commissions)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(schema.commissions.createdAt));

        return rows;
      }),

    // Mark a commission as paid (admin only)
    markPaid: protectedProcedure
      .input(z.object({
        commissionId: z.number(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.commissions)
          .set({ status: 'paid', paidAt: new Date(), paidByUserId: ctx.user.id, adminNotes: input.adminNotes ?? null })
          .where(eq(schema.commissions.id, input.commissionId));
        return { success: true };
      }),

    // Void a commission (admin only)
    voidCommission: protectedProcedure
      .input(z.object({
        commissionId: z.number(),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.commissions)
          .set({ status: 'voided', adminNotes: input.adminNotes ?? null })
          .where(eq(schema.commissions.id, input.commissionId));
        return { success: true };
      }),

    // Get staff members list (for assignment dropdown)
    getStaffList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const staff = await db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role, phone: schema.users.phone, leadSmsNotify: schema.users.leadSmsNotify })
        .from(schema.users)
        .where(sql`${schema.users.role} IN ('staff', 'admin')`);
      return staff;
    }),

    // Update own notification phone number and SMS opt-in (staff/admin)
    updateNotificationPhone: protectedProcedure
      .input(z.object({
        phone: z.string().max(20).optional(),
        leadSmsNotify: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.users)
          .set({
            phone: input.phone || null,
            leadSmsNotify: input.leadSmsNotify ? 1 : 0,
          })
          .where(eq(schema.users.id, ctx.user.id));
        return { success: true };
      }),

    // Admin: update any staff member's notification phone (admin only)
    adminUpdateStaffPhone: protectedProcedure
      .input(z.object({
        userId: z.number(),
        phone: z.string().max(20).optional(),
        leadSmsNotify: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.users)
          .set({
            phone: input.phone || null,
            leadSmsNotify: input.leadSmsNotify ? 1 : 0,
          })
          .where(eq(schema.users.id, input.userId));
        return { success: true };
      }),

    // Get commission summary per staff member (admin only)
    getStaffSummary: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin only' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const rows = await db
        .select({
          staffUserId: schema.commissions.staffUserId,
          staffName: schema.commissions.staffName,
          status: schema.commissions.status,
          totalBonusCents: sql<number>`SUM(${schema.commissions.bonusAmountCents})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(schema.commissions)
        .groupBy(schema.commissions.staffUserId, schema.commissions.staffName, schema.commissions.status);
      return rows;
    }),
  }),

  childProfiles: router({
  // List all child profiles for the logged-in parent
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    return db
      .select()
      .from(schema.childProfiles)
      .where(eq(schema.childProfiles.userId, ctx.user.id))
      .orderBy(schema.childProfiles.createdAt);
  }),

  // Create a new child profile
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      program: z.enum(['Little Ninjas', 'Dragon Kids', 'Teens', 'Adult Karate', 'Kickboxing', 'After School', 'Summer Camp', 'Not Sure']).optional(),
      photoUrl: z.string().url().optional(),
      photoKey: z.string().optional(),
      notes: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.insert(schema.childProfiles).values({
        userId: ctx.user.id,
        name: input.name,
        dateOfBirth: input.dateOfBirth ?? null,
        program: input.program ?? 'Not Sure',
        photoUrl: input.photoUrl ?? null,
        photoKey: input.photoKey ?? null,
        notes: input.notes ?? null,
      });
      const [created] = await db
        .select()
        .from(schema.childProfiles)
        .where(eq(schema.childProfiles.userId, ctx.user.id))
        .orderBy(desc(schema.childProfiles.createdAt))
        .limit(1);
      return created;
    }),

  // Update an existing child profile
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
      program: z.enum(['Little Ninjas', 'Dragon Kids', 'Teens', 'Adult Karate', 'Kickboxing', 'After School', 'Summer Camp', 'Not Sure']).optional(),
      photoUrl: z.string().url().optional().nullable(),
      photoKey: z.string().optional().nullable(),
      notes: z.string().max(1000).optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      // Ensure the profile belongs to this user
      const [existing] = await db
        .select({ id: schema.childProfiles.id })
        .from(schema.childProfiles)
        .where(and(eq(schema.childProfiles.id, input.id), eq(schema.childProfiles.userId, ctx.user.id)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Child profile not found' });
      const { id, ...updates } = input;
      await db
        .update(schema.childProfiles)
        .set(updates)
        .where(eq(schema.childProfiles.id, id));
      const [updated] = await db
        .select()
        .from(schema.childProfiles)
        .where(eq(schema.childProfiles.id, id))
        .limit(1);
      return updated;
    }),

  // Delete a child profile (and its S3 photo if present)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const [existing] = await db
        .select()
        .from(schema.childProfiles)
        .where(and(eq(schema.childProfiles.id, input.id), eq(schema.childProfiles.userId, ctx.user.id)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Child profile not found' });
      await db.delete(schema.childProfiles).where(eq(schema.childProfiles.id, input.id));
      return { success: true };
    }),

  // Upload a photo for a child profile — returns S3 URL and key
  uploadPhoto: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string().regex(/^image\//),
      base64Data: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const randomSuffix = Math.random().toString(36).slice(2, 10);
      const ext = input.fileName.split('.').pop() ?? 'jpg';
      const fileKey = `child-photos/${ctx.user.id}/${randomSuffix}.${ext}`;
      const buffer = Buffer.from(input.base64Data, 'base64');
      const { url } = await storagePut(fileKey, buffer, input.contentType);
      return { url, key: fileKey };
    }),

  // Admin: list all child profiles
  adminList: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const conditions = input.userId ? [eq(schema.childProfiles.userId, input.userId)] : [];
      return db
        .select()
        .from(schema.childProfiles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(schema.childProfiles.createdAt));
    }),
  }),

  // ─── Staff Schedule & Availability ───────────────────────────────────────
  staffSchedule: router({
    getWeeklySchedule: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const classes = await db
        .select()
        .from(schema.classSchedule)
        .where(eq(schema.classSchedule.isActive, 1))
        .orderBy(
          sql`FIELD(${schema.classSchedule.dayOfWeek},'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')`,
          asc(schema.classSchedule.startTime)
        );
      const assignments = await db
        .select()
        .from(schema.staffScheduleAssignments)
        .where(eq(schema.staffScheduleAssignments.isActive, 1));
      return { classes, assignments };
    }),

    getStaffList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role })
        .from(schema.users)
        .where(or(eq(schema.users.role, 'admin'), eq(schema.users.role, 'staff')))
        .orderBy(asc(schema.users.name));
    }),

    assignStaff: protectedProcedure
      .input(z.object({
        classScheduleId: z.number(),
        staffUserId: z.number(),
        staffName: z.string(),
        role: z.enum(['primary', 'backup']).default('primary'),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const existing = await db
          .select()
          .from(schema.staffScheduleAssignments)
          .where(and(
            eq(schema.staffScheduleAssignments.classScheduleId, input.classScheduleId),
            eq(schema.staffScheduleAssignments.staffUserId, input.staffUserId),
          ))
          .limit(1);
        if (existing.length > 0) {
          await db
            .update(schema.staffScheduleAssignments)
            .set({ role: input.role, isActive: 1 })
            .where(eq(schema.staffScheduleAssignments.id, existing[0].id));
          return { success: true };
        }
        await db.insert(schema.staffScheduleAssignments).values({
          classScheduleId: input.classScheduleId,
          staffUserId: input.staffUserId,
          staffName: input.staffName,
          role: input.role,
          isActive: 1,
        });
        return { success: true };
      }),

    removeAssignment: protectedProcedure
      .input(z.object({ assignmentId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.staffScheduleAssignments)
          .set({ isActive: 0 })
          .where(eq(schema.staffScheduleAssignments.id, input.assignmentId));
        return { success: true };
      }),

    getAvailability: protectedProcedure
      .input(z.object({ startDate: z.string(), endDate: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        return db
          .select()
          .from(schema.staffAvailability)
          .where(and(
            sql`${schema.staffAvailability.date} >= ${input.startDate}`,
            sql`${schema.staffAvailability.date} <= ${input.endDate}`,
          ))
          .orderBy(asc(schema.staffAvailability.date));
      }),

    markUnavailable: protectedProcedure
      .input(z.object({
        date: z.string(),
        classScheduleId: z.number().optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const baseConditions = [
          eq(schema.staffAvailability.staffUserId, ctx.user.id),
          eq(schema.staffAvailability.date, input.date),
        ];
        const existing = await db
          .select()
          .from(schema.staffAvailability)
          .where(and(...baseConditions))
          .limit(1);
        if (existing.length > 0) {
          await db
            .update(schema.staffAvailability)
            .set({ status: 'needs_cover', reason: input.reason ?? null })
            .where(eq(schema.staffAvailability.id, existing[0].id));
        } else {
          await db.insert(schema.staffAvailability).values({
            staffUserId: ctx.user.id,
            staffName: ctx.user.name ?? ctx.user.email,
            date: input.date,
            classScheduleId: input.classScheduleId ?? null,
            status: 'needs_cover',
            reason: input.reason ?? null,
          });
        }
        return { success: true };
      }),

    removeUnavailable: protectedProcedure
      .input(z.object({ availabilityId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const record = await db
          .select()
          .from(schema.staffAvailability)
          .where(eq(schema.staffAvailability.id, input.availabilityId))
          .limit(1);
        if (!record.length) throw new TRPCError({ code: 'NOT_FOUND' });
        if (ctx.user.role !== 'admin' && record[0].staffUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        await db
          .delete(schema.staffAvailability)
          .where(eq(schema.staffAvailability.id, input.availabilityId));
        return { success: true };
      }),

    assignCover: protectedProcedure
      .input(z.object({
        availabilityId: z.number(),
        coverStaffUserId: z.number(),
        coverStaffName: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.staffAvailability)
          .set({
            status: 'covered',
            coverStaffUserId: input.coverStaffUserId,
            coverStaffName: input.coverStaffName,
            notes: input.notes ?? null,
          })
          .where(eq(schema.staffAvailability.id, input.availabilityId));
        return { success: true };
      }),
  }),

  // ─── Student Appointments ─────────────────────────────────────────────────
  studentAppointments: router({
    // List all appointments for a student
    listByStudent: protectedProcedure
      .input(z.object({ studentId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        return db
          .select()
          .from(schema.studentAppointments)
          .where(eq(schema.studentAppointments.studentId, input.studentId))
          .orderBy(sql`${schema.studentAppointments.scheduledTime} DESC`);
      }),

    // List upcoming appointments (admin view)
    listUpcoming: protectedProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        return db
          .select()
          .from(schema.studentAppointments)
          .where(
            sql`${schema.studentAppointments.status} = 'scheduled'
                AND ${schema.studentAppointments.scheduledTime} >= NOW()`
          )
          .orderBy(sql`${schema.studentAppointments.scheduledTime} ASC`);
      }),

    // Book a new appointment for a student
    book: protectedProcedure
      .input(z.object({
        studentId: z.number(),
        studentName: z.string(),
        studentPhone: z.string(),
        program: z.string(),
        scheduledTime: z.date(),
        location: z.string().optional(),
        instructor: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const result = await db.insert(schema.studentAppointments).values({
          studentId: input.studentId,
          studentName: input.studentName,
          studentPhone: input.studentPhone,
          program: input.program,
          scheduledTime: input.scheduledTime,
          location: input.location ?? 'HQ - Tomball',
          instructor: input.instructor ?? null,
          notes: input.notes ?? null,
          status: 'scheduled',
        });
        return { success: true, id: Number((result as any).insertId) };
      }),

    // Update appointment status
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.studentAppointments)
          .set({ status: input.status })
          .where(eq(schema.studentAppointments.id, input.id));
        return { success: true };
      }),

    // Cancel an appointment
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db
          .update(schema.studentAppointments)
          .set({ status: 'cancelled' })
          .where(eq(schema.studentAppointments.id, input.id));
        return { success: true };
      }),
   }),

  // ─── Social Media ─────────────────────────────────────────────────────────────
  socialMedia: router({
    // Check if credentials are configured
    getConfig: protectedProcedure
      .query(() => ({
        facebookConfigured: isFacebookConfigured(),
        instagramConfigured: isInstagramConfigured(),
      })),

    // List all posts
    listPosts: protectedProcedure
      .input(z.object({
        status: z.enum(['draft', 'scheduled', 'published', 'failed', 'all']).default('all'),
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const query = db.select().from(schema.socialPosts);
        if (input.status !== 'all') {
          return query
            .where(eq(schema.socialPosts.status, input.status))
            .orderBy(sql`${schema.socialPosts.createdAt} DESC`)
            .limit(input.limit);
        }
        return query
          .orderBy(sql`${schema.socialPosts.createdAt} DESC`)
          .limit(input.limit);
      }),

    // Create a draft post
    createDraft: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(63206),
        imageUrl: z.string().url().optional(),
        imageKey: z.string().optional(),
        platforms: z.enum(['facebook', 'instagram', 'both']).default('both'),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const result = await db.insert(schema.socialPosts).values({
          message: input.message,
          imageUrl: input.imageUrl ?? null,
          imageKey: input.imageKey ?? null,
          platforms: input.platforms,
          status: 'draft',
          createdByName: ctx.user.name ?? ctx.user.email,
        });
        return { success: true, id: Number((result as any).insertId) };
      }),

    // Publish immediately
    publishNow: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(63206),
        imageUrl: z.string().url().optional(),
        imageKey: z.string().optional(),
        platforms: z.enum(['facebook', 'instagram', 'both']).default('both'),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        let facebookPostId: string | null = null;
        let instagramPostId: string | null = null;
        let errorMessage: string | null = null;
        let status: 'published' | 'failed' = 'published';

        try {
          if (input.platforms === 'facebook' || input.platforms === 'both') {
            facebookPostId = await postToFacebook(input.message, input.imageUrl);
          }
          if ((input.platforms === 'instagram' || input.platforms === 'both') && input.imageUrl) {
            instagramPostId = await postToInstagram(input.message, input.imageUrl);
          }
        } catch (err: unknown) {
          errorMessage = err instanceof Error ? err.message : String(err);
          status = 'failed';
        }

        const result = await db.insert(schema.socialPosts).values({
          message: input.message,
          imageUrl: input.imageUrl ?? null,
          imageKey: input.imageKey ?? null,
          platforms: input.platforms,
          status,
          publishedAt: status === 'published' ? new Date() : null,
          facebookPostId: facebookPostId ?? null,
          instagramPostId: instagramPostId ?? null,
          errorMessage: errorMessage ?? null,
          createdByName: ctx.user.name ?? ctx.user.email,
        });

        if (status === 'failed') {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: errorMessage ?? 'Failed to publish post' });
        }
        return { success: true, id: Number((result as any).insertId), facebookPostId, instagramPostId };
      }),

    // Schedule a post for later
    schedulePost: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(63206),
        imageUrl: z.string().url().optional(),
        imageKey: z.string().optional(),
        platforms: z.enum(['facebook', 'instagram', 'both']).default('both'),
        scheduledFor: z.date(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        if (input.scheduledFor <= new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Scheduled time must be in the future' });
        }
        const result = await db.insert(schema.socialPosts).values({
          message: input.message,
          imageUrl: input.imageUrl ?? null,
          imageKey: input.imageKey ?? null,
          platforms: input.platforms,
          status: 'scheduled',
          scheduledFor: input.scheduledFor,
          createdByName: ctx.user.name ?? ctx.user.email,
        });
        return { success: true, id: Number((result as any).insertId) };
      }),

    // Delete a post (draft or failed only)
    deletePost: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.delete(schema.socialPosts).where(eq(schema.socialPosts.id, input.id));
        return { success: true };
      }),

    // Refresh engagement stats for a published post
    refreshStats: protectedProcedure
      .input(z.object({ id: z.number(), facebookPostId: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const stats = await getFacebookPostStats(input.facebookPostId);
        await db
          .update(schema.socialPosts)
          .set({ likes: stats.likes, comments: stats.comments, shares: stats.shares })
          .where(eq(schema.socialPosts.id, input.id));
        return stats;
      }),

    // Upload image for a post (returns S3 URL)
    uploadImage: protectedProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
        filename: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.base64, 'base64');
        const suffix = Date.now().toString(36);
        const key = `social-posts/${suffix}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url, key };
      }),
  }),

  // ─── Staff Calendar ────────────────────────────────────────────────────────
  calendar: router({
    getTasksForMonth: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        const tasks = await getCalendarTasksForMonth(input.year, input.month);
        const timeOff = await getApprovedTimeOffForMonth(input.year, input.month);
        return { tasks, timeOff };
      }),

    getMyTasks: protectedProcedure
      .input(z.object({ year: z.number(), month: z.number() }))
      .query(async ({ input, ctx }) => {
        return getCalendarTasksForUser(ctx.user.id, input.year, input.month);
      }),

    createTask: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        taskDate: z.date(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        assignedToUserId: z.number().optional(),
        assignedToName: z.string().optional(),
        category: z.enum(['class', 'meeting', 'cleaning', 'event', 'training', 'other']).default('other'),
        priority: z.enum(['low', 'medium', 'high']).default('medium'),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await createCalendarTask({
          ...input,
          createdByUserId: ctx.user.id,
          createdByName: ctx.user.name ?? ctx.user.email,
          status: 'pending',
        });
        return { success: true };
      }),

    updateTask: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        taskDate: z.date().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        assignedToUserId: z.number().nullable().optional(),
        assignedToName: z.string().nullable().optional(),
        category: z.enum(['class', 'meeting', 'cleaning', 'event', 'training', 'other']).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
        staffNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        if (ctx.user.role === 'staff') {
          const allowed: Record<string, unknown> = {};
          if (updates.status !== undefined) allowed.status = updates.status;
          if (updates.staffNotes !== undefined) allowed.staffNotes = updates.staffNotes;
          await updateCalendarTask(id, allowed as any);
        } else if (ctx.user.role === 'admin') {
          await updateCalendarTask(id, updates as any);
        } else {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return { success: true };
      }),

    deleteTask: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await deleteCalendarTask(input.id);
        return { success: true };
      }),

    requestTimeOff: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string().optional(),
        type: z.enum(['vacation', 'sick', 'personal', 'emergency', 'other']).default('personal'),
      }))
      .mutation(async ({ input, ctx }) => {
        await createTimeOffRequest({
          userId: ctx.user.id,
          userName: ctx.user.name ?? ctx.user.email,
          userEmail: ctx.user.email,
          ...input,
          status: 'pending',
        });
        return { success: true };
      }),

    getMyTimeOff: protectedProcedure
      .query(async ({ ctx }) => {
        return getTimeOffRequestsForUser(ctx.user.id);
      }),

    getAllTimeOff: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        return getAllTimeOffRequests();
      }),

    reviewTimeOff: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['approved', 'denied']),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await updateTimeOffRequest(input.id, {
          status: input.status,
          adminNotes: input.adminNotes,
          reviewedByUserId: ctx.user.id,
          reviewedByName: ctx.user.name ?? ctx.user.email,
          reviewedAt: new Date(),
        });
        return { success: true };
      }),

    getStaffList: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) return [];
        return db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role })
          .from(schema.users)
          .where(inArray(schema.users.role, ['staff', 'admin']));
      }),
  }),

  // ── Arcade ──────────────────────────────────────────────────────────────
  arcade: router({
    /** Save a game score after a student finishes a game */
    saveScore: publicProcedure
      .input(z.object({
        enrollmentId: z.number(),
        studentName: z.string(),
        gameId: z.string(),
        gameName: z.string(),
        score: z.number(),
        level: z.number().optional().default(1),
        duration: z.number().optional().default(0),
        checkedIn: z.number().optional().default(0),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB not available' });
        await db.insert(schema.arcadeScores).values({
          enrollmentId: input.enrollmentId,
          studentName: input.studentName,
          gameId: input.gameId,
          gameName: input.gameName,
          score: input.score,
          level: input.level ?? 1,
          duration: input.duration ?? 0,
          checkedIn: input.checkedIn ?? 0,
          playedAt: Date.now(),
        });
        return { success: true };
      }),

    /** Get top scores for a specific game (leaderboard) */
    getLeaderboard: publicProcedure
      .input(z.object({
        gameId: z.string(),
        limit: z.number().optional().default(10),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select()
          .from(schema.arcadeScores)
          .where(eq(schema.arcadeScores.gameId, input.gameId))
          .orderBy(desc(schema.arcadeScores.score))
          .limit(input.limit);
      }),

    /** Get all scores for a specific student */
    getStudentScores: publicProcedure
      .input(z.object({ enrollmentId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select()
          .from(schema.arcadeScores)
          .where(eq(schema.arcadeScores.enrollmentId, input.enrollmentId))
          .orderBy(desc(schema.arcadeScores.playedAt))
          .limit(50);
      }),

    /** Get all-time top scores across all games */
    getAllTimeLeaderboard: publicProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) return [];
        return db.select()
          .from(schema.arcadeScores)
          .orderBy(desc(schema.arcadeScores.score))
          .limit(20);
      }),
  }),

  // ─── Staff Time Tracking ─────────────────────────────────────────────────
  staffTime: router({
    /** Clock in — opens a new shift for the authenticated staff member */
    clockIn: protectedProcedure
      .input(z.object({ location: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        // Check if already clocked in
        const open = await db.select()
          .from(schema.staffShifts)
          .where(and(
            eq(schema.staffShifts.staffUserId, ctx.user.id),
            isNull(schema.staffShifts.clockOutAt)
          ))
          .limit(1);
        if (open.length > 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already clocked in' });
        const [shift] = await db.insert(schema.staffShifts).values({
          staffUserId: ctx.user.id,
          staffName: ctx.user.name ?? ctx.user.email,
          clockInAt: Date.now(),
          location: input.location ?? 'HQ',
        }).$returningId();
        return { shiftId: shift.id };
      }),

    /** Clock out — closes the open shift and calculates total minutes */
    clockOut: protectedProcedure
      .input(z.object({ notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const [open] = await db.select()
          .from(schema.staffShifts)
          .where(and(
            eq(schema.staffShifts.staffUserId, ctx.user.id),
            isNull(schema.staffShifts.clockOutAt)
          ))
          .limit(1);
        if (!open) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not clocked in' });
        const now = Date.now();
        const totalMinutes = Math.round((now - open.clockInAt) / 60000);
        await db.update(schema.staffShifts)
          .set({ clockOutAt: now, totalMinutes, notes: input.notes ?? null, updatedAt: new Date() })
          .where(eq(schema.staffShifts.id, open.id));
        return { shiftId: open.id, totalMinutes };
      }),

    /** Get the current open shift for the logged-in staff member */
    getActiveShift: protectedProcedure
      .query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return null;
        const [open] = await db.select()
          .from(schema.staffShifts)
          .where(and(
            eq(schema.staffShifts.staffUserId, ctx.user.id),
            isNull(schema.staffShifts.clockOutAt)
          ))
          .limit(1);
        if (!open) return null;
        const classes = await db.select()
          .from(schema.shiftClasses)
          .where(eq(schema.shiftClasses.shiftId, open.id))
          .orderBy(asc(schema.shiftClasses.classStartAt));
        return { shift: open, classes };
      }),

    /** Log a class taught during the current open shift */
    logClass: protectedProcedure
      .input(z.object({
        program: z.string().min(1),
        classStartAt: z.number(),
        studentCount: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const [open] = await db.select()
          .from(schema.staffShifts)
          .where(and(
            eq(schema.staffShifts.staffUserId, ctx.user.id),
            isNull(schema.staffShifts.clockOutAt)
          ))
          .limit(1);
        if (!open) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No active shift — clock in first' });
        await db.insert(schema.shiftClasses).values({
          shiftId: open.id,
          staffUserId: ctx.user.id,
          program: input.program,
          classStartAt: input.classStartAt,
          studentCount: input.studentCount ?? null,
          notes: input.notes ?? null,
        });
        return { ok: true };
      }),

    /** Delete a logged class from the current open shift */
    deleteClass: protectedProcedure
      .input(z.object({ classId: z.number().int() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        await db.delete(schema.shiftClasses)
          .where(and(
            eq(schema.shiftClasses.id, input.classId),
            eq(schema.shiftClasses.staffUserId, ctx.user.id)
          ));
        return { ok: true };
      }),

    /** Admin: get all shifts with optional filters */
    adminGetShifts: protectedProcedure
      .input(z.object({
        staffUserId: z.number().int().optional(),
        from: z.number().optional(),
        to: z.number().optional(),
        limit: z.number().int().min(1).max(200).default(100),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) return [];
        const conditions = [];
        if (input.staffUserId) conditions.push(eq(schema.staffShifts.staffUserId, input.staffUserId));
        if (input.from) conditions.push(sql`${schema.staffShifts.clockInAt} >= ${input.from}`);
        if (input.to) conditions.push(sql`${schema.staffShifts.clockInAt} <= ${input.to}`);
        const shifts = await db.select()
          .from(schema.staffShifts)
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(schema.staffShifts.clockInAt))
          .limit(input.limit);
        // Attach classes for each shift
        const shiftIds = shifts.map(s => s.id);
        const classes = shiftIds.length
          ? await db.select().from(schema.shiftClasses).where(inArray(schema.shiftClasses.shiftId, shiftIds))
          : [];
        return shifts.map(s => ({
          ...s,
          classes: classes.filter(c => c.shiftId === s.id),
        }));
      }),

    /** Admin: get summary of hours per staff member for a date range */
    adminGetHoursSummary: protectedProcedure
      .input(z.object({
        from: z.number().optional(),
        to: z.number().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) return [];
        const conditions = [];
        if (input.from) conditions.push(sql`${schema.staffShifts.clockInAt} >= ${input.from}`);
        if (input.to) conditions.push(sql`${schema.staffShifts.clockInAt} <= ${input.to}`);
        conditions.push(isNotNull(schema.staffShifts.clockOutAt));
        const rows = await db.select({
          staffUserId: schema.staffShifts.staffUserId,
          staffName: schema.staffShifts.staffName,
          totalMinutes: sql<number>`SUM(${schema.staffShifts.totalMinutes})`,
          shiftCount: sql<number>`COUNT(*)`,
        })
          .from(schema.staffShifts)
          .where(and(...conditions))
          .groupBy(schema.staffShifts.staffUserId, schema.staffShifts.staffName);
        return rows;
      }),

    /** Admin: get all staff members (users with role staff or admin) */
    adminGetStaffList: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) return [];
        return db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role })
          .from(schema.users)
          .where(or(eq(schema.users.role, 'staff'), eq(schema.users.role, 'admin')));
      }),
  }),

  // ── Family Discount Router ─────────────────────────────────────────────────
  family: router({
    /** Create a new family group and charge the one-time $99 registration fee via FluidPay */
    createFamilyGroup: publicProcedure
      .input(z.object({
        primaryContactName: z.string().min(2),
        primaryContactEmail: z.string().email(),
        primaryContactPhone: z.string().optional(),
        cardToken: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const FLUIDPAY_API_URL = 'https://app.fluidpay.com';
        const FLUIDPAY_KEY = process.env.FLUIDPAY_SECRET_KEY || '';
        // 1. Create customer vault
        const vaultRes = await fetch(`${FLUIDPAY_API_URL}/api/customer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': FLUIDPAY_KEY },
          body: JSON.stringify({
            description: `Family: ${input.primaryContactName}`,
            payment_method: { card: { token_id: input.cardToken } },
          }),
        });
        const vaultData = await vaultRes.json() as any;
        const fpCustomerId = vaultData?.data?.id;
        if (!fpCustomerId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create payment vault' });
        // 2. Charge $99 family registration fee
        const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': FLUIDPAY_KEY },
          body: JSON.stringify({
            type: 'sale',
            amount: 9900,
            currency: 'USD',
            payment_method: { customer: { id: fpCustomerId } },
            billing_address: {
              first_name: input.primaryContactName.split(' ')[0],
              last_name: input.primaryContactName.split(' ').slice(1).join(' ') || 'Family',
              email: input.primaryContactEmail,
            },
            order_id: `FAMILY-REG-${Date.now()}`,
            description: 'MyDojo Family Registration Fee',
          }),
        });
        const chargeData = await chargeRes.json() as any;
        if (chargeData?.data?.status !== 'pending_settlement' && chargeData?.data?.status !== 'approved') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: chargeData?.msg || 'Payment failed. Please check your card details.' });
        }
        const txId = chargeData?.data?.id;
        // 3. Save family group
        const [result] = await db.insert(schema.familyGroups).values({
          primaryContactName: input.primaryContactName,
          primaryContactEmail: input.primaryContactEmail,
          primaryContactPhone: input.primaryContactPhone,
          registrationFeePaid: 1,
          registrationFeeTransactionId: txId,
          registrationFeeAmount: '99.00',
          registrationFeePaidAt: new Date(),
          fluidpayCustomerId: fpCustomerId,
        });
        const familyGroupId = (result as any).insertId;
        return { familyGroupId, fpCustomerId, txId, success: true };
      }),

    /** Look up a family group by email */
    getFamilyGroupByEmail: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const groups = await db.select().from(schema.familyGroups)
          .where(eq(schema.familyGroups.primaryContactEmail, input.email))
          .limit(1);
        if (!groups.length) return null;
        const group = groups[0];
        const members = await db.select().from(schema.familyGroupMembers)
          .where(eq(schema.familyGroupMembers.familyGroupId, group.id));
        return { ...group, members };
      }),

    /** Add an enrollment to a family group (2nd+ members get 50% off) */
    addMemberToFamilyGroup: publicProcedure
      .input(z.object({
        familyGroupId: z.number(),
        enrollmentId: z.number(),
        originalMonthlyAmount: z.number(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const existing = await db.select().from(schema.familyGroupMembers)
          .where(eq(schema.familyGroupMembers.familyGroupId, input.familyGroupId));
        const memberOrder = existing.length + 1;
        const hasDiscount = memberOrder >= 2 ? 1 : 0;
        const discountedMonthlyAmount = hasDiscount ? (input.originalMonthlyAmount * 0.5).toFixed(2) : null;
        await db.insert(schema.familyGroupMembers).values({
          familyGroupId: input.familyGroupId,
          enrollmentId: input.enrollmentId,
          memberOrder,
          hasDiscount,
          discountedMonthlyAmount: discountedMonthlyAmount ?? undefined,
          originalMonthlyAmount: input.originalMonthlyAmount.toFixed(2),
        });
        return {
          memberOrder,
          hasDiscount: !!hasDiscount,
          discountedMonthlyAmount: hasDiscount ? input.originalMonthlyAmount * 0.5 : input.originalMonthlyAmount,
        };
      }),

    /** Add a family member to kickboxing at the discounted $49/month family rate */
    addFamilyKickboxingMember: protectedProcedure
      .input(z.object({
        memberName: z.string().min(2, 'Name is required'),
        memberEmail: z.string().email('Valid email required'),
        memberPhone: z.string().optional(),
        cardToken: z.string().min(1, 'Payment token is required'),
      }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'DB unavailable' });
        const FLUIDPAY_API_URL = 'https://app.fluidpay.com';
        const FLUIDPAY_SECRET_KEY = process.env.FLUIDPAY_SECRET_KEY;
        if (!FLUIDPAY_SECRET_KEY) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Payment processor not configured' });
        const fpHeaders = { 'Authorization': FLUIDPAY_SECRET_KEY, 'Content-Type': 'application/json' };
        // Look up the family group by the logged-in user's email
        // Auto-create a family group if one doesn't exist — no pre-registration required
        let groups = await db.select().from(schema.familyGroups)
          .where(eq(schema.familyGroups.primaryContactEmail, ctx.user.email))
          .limit(1);
        if (!groups.length) {
          console.log(`[FamilyKickboxing] No family group found for ${ctx.user.email} — auto-creating one`);
          const [insertFg] = await db.insert(schema.familyGroups).values({
            primaryContactName: ctx.user.name || ctx.user.email,
            primaryContactEmail: ctx.user.email,
            primaryContactPhone: '',
          });
          const newFgId = (insertFg as any).insertId;
          groups = await db.select().from(schema.familyGroups)
            .where(eq(schema.familyGroups.id, newFgId))
            .limit(1);
        }
        const familyGroup = groups[0];
        // Step 1: Create customer vault with the new card token
        const nameParts = input.memberName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        const vaultRes = await fetch(`${FLUIDPAY_API_URL}/api/vault/customer`, {
          method: 'POST',
          headers: fpHeaders,
          body: JSON.stringify({
            description: `MyDojo Kickboxing Family Member: ${input.memberName}`,
            default_payment: { token: input.cardToken },
            default_billing_address: {
              first_name: firstName,
              last_name: lastName,
              email: input.memberEmail,
              phone: (input.memberPhone || '').replace(/\D/g, ''),
            },
          }),
        });
        const vaultData = await vaultRes.json() as any;
        if (vaultData.status !== 'success') {
          console.error('[FluidPay] Vault creation failed:', vaultData);
          throw new TRPCError({ code: 'BAD_REQUEST', message: vaultData.msg || 'Failed to save payment method' });
        }
        const fpCustomerId = vaultData.data.id;
        // Step 2: Charge first month ($49)
        const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
          method: 'POST',
          headers: fpHeaders,
          body: JSON.stringify({
            type: 'sale',
            amount: 4900,
            currency: 'USD',
            payment_method: { customer: { id: fpCustomerId } },
            billing_address: { first_name: firstName, last_name: lastName, email: input.memberEmail },
            order_id: `KICKBOXING-FAMILY-${Date.now()}`,
            description: `MyDojo Kickboxing Family Add-On - ${input.memberName} (First Month)`,
          }),
        });
        const chargeData = await chargeRes.json() as any;
        if (chargeData.status !== 'success' || !chargeData.data) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: chargeData.msg || 'Payment failed' });
        }
        const txn = chargeData.data;
        if (txn.status !== 'approved' && txn.status !== 'pending_settlement') {
          const declineMsg = txn.response_body?.card?.processor_response_text || `Transaction ${txn.status}`;
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Payment declined: ${declineMsg}` });
        }
        const fpTransactionId = txn.id;
        // Step 3: Create recurring subscription for monthly billing ($49/month)
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        const startDate = nextMonthDate.toISOString().slice(0, 10);
        const subscriptionRes = await fetch(`${FLUIDPAY_API_URL}/api/recurring/subscription`, {
          method: 'POST',
          headers: fpHeaders,
          body: JSON.stringify({
            description: `MyDojo Kickboxing Family Add-On - ${input.memberName}`,
            customer: { id: fpCustomerId },
            amount: 4900,
            billing_cycle_interval: 1,
            billing_frequency: 'monthly',
            billing_days: '1',
            next_bill_date: startDate,
          }),
        });
        const subscriptionData = await subscriptionRes.json() as any;
        let fpSubscriptionId: string | null = null;
        if (subscriptionData.status === 'success') {
          fpSubscriptionId = subscriptionData.data?.id || null;
        } else {
          console.error('[FluidPay] Kickboxing subscription creation failed:', subscriptionData);
        }
        // Step 4: Save the add-on record
        const insertResult = await db.insert(schema.familyKickboxingAddOns).values({
          familyGroupId: familyGroup.id,
          memberName: input.memberName,
          memberEmail: input.memberEmail,
          memberPhone: input.memberPhone || null,
          monthlyAmount: '49.00',
          fluidpayCustomerId: fpCustomerId,
          fluidpaySubscriptionId: fpSubscriptionId,
          firstChargeTransactionId: fpTransactionId,
          status: 'active',
        });
        const addOnId = (insertResult as any).insertId;
        // Step 5: Notify owner
        try {
          const { notifyOwner } = await import('./_core/notification');
          await notifyOwner({
            title: 'New Family Kickboxing Add-On',
            content: `${ctx.user.name || ctx.user.email} added ${input.memberName} (${input.memberEmail}) to kickboxing at $49/month. Transaction: ${fpTransactionId}`,
          });
        } catch {}
        // Step 6: Notify staff via SMS (fire-and-forget)
        import('./notifyStaffNewEnrollment').then(({ notifyStaffNewEnrollment }) => {
          notifyStaffNewEnrollment({
            studentName: input.memberName,
            customerName: ctx.user.name || ctx.user.email,
            customerEmail: ctx.user.email,
            customerPhone: input.memberPhone,
            packageName: 'Family Kickboxing Add-On',
            amountCharged: 49.00,
            program: 'Kickboxing',
          }).catch(() => {});
        }).catch(() => {});
        return { success: true, addOnId, transactionId: fpTransactionId, subscriptionId: fpSubscriptionId };
      }),
    /** Get all kickboxing add-ons for the current user's family group */
    getFamilyKickboxingAddOns: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const groups = await db.select().from(schema.familyGroups)
        .where(eq(schema.familyGroups.primaryContactEmail, ctx.user.email))
        .limit(1);
      if (!groups.length) return [];
      const addOns = await db.select().from(schema.familyKickboxingAddOns)
        .where(eq(schema.familyKickboxingAddOns.familyGroupId, groups[0].id))
        .orderBy(desc(schema.familyKickboxingAddOns.createdAt));
      return addOns;
    }),
    /** Admin: list all family groups with member counts */
    adminListFamilyGroups: protectedProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) return [];
        const groups = await db.select().from(schema.familyGroups).orderBy(desc(schema.familyGroups.createdAt));
        const result = await Promise.all(groups.map(async (g) => {
          const members = await db.select().from(schema.familyGroupMembers)
            .where(eq(schema.familyGroupMembers.familyGroupId, g.id));
          return { ...g, memberCount: members.length, members };
        }));
        if (input?.search) {
          const s = input.search.toLowerCase();
          return result.filter(g =>
            g.primaryContactName.toLowerCase().includes(s) ||
            g.primaryContactEmail.toLowerCase().includes(s)
          );
        }
        return result;
      }),
  }),

  // ── Promo Codes ────────────────────────────────────────────────────────────
  promo: router({
    /** Validate a promo code and return discount details */
    validate: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const code = input.code.trim().toUpperCase();
        const [promo] = await db.select().from(schema.promoCodes)
          .where(eq(schema.promoCodes.code, code))
          .limit(1);
        if (!promo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid promo code' });
        if (!promo.active) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This promo code is no longer active' });
        if (promo.expiresAt && Date.now() > promo.expiresAt) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This promo code has expired' });
        if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) throw new TRPCError({ code: 'BAD_REQUEST', message: 'This promo code has reached its maximum uses' });
        return {
          id: promo.id,
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: parseFloat(promo.discountValue as string),
        };
      }),

    /** Mark a promo code as used (called after successful enrollment) */
    markUsed: publicProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const code = input.code.trim().toUpperCase();
        await db.update(schema.promoCodes)
          .set({ usedCount: sql`usedCount + 1`, updatedAt: Date.now() })
          .where(eq(schema.promoCodes.code, code));
        return { success: true };
      }),

    /** Admin: list all promo codes */
    adminList: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) return [];
        return db.select().from(schema.promoCodes).orderBy(desc(schema.promoCodes.createdAt));
      }),

    /** Admin: create a new promo code */
    adminCreate: protectedProcedure
      .input(z.object({
        code: z.string().min(3).max(50),
        description: z.string().min(3).max(255),
        discountType: z.enum(['percent', 'fixed', 'waive_down_payment']),
        discountValue: z.number().min(0).max(100),
        maxUses: z.number().optional(),
        expiresAt: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const code = input.code.trim().toUpperCase();
        await db.insert(schema.promoCodes).values({
          code,
          description: input.description,
          discountType: input.discountType,
          discountValue: input.discountValue.toFixed(2),
          maxUses: input.maxUses ?? null,
          expiresAt: input.expiresAt ?? null,
          active: 1,
          createdBy: ctx.user.name ?? ctx.user.email ?? 'admin',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        return { success: true, code };
      }),

    /** Admin: toggle active status of a promo code */
    adminToggle: protectedProcedure
      .input(z.object({ id: z.number(), active: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        await db.update(schema.promoCodes)
          .set({ active: input.active ? 1 : 0, updatedAt: Date.now() })
          .where(eq(schema.promoCodes.id, input.id));
        return { success: true };
      }),
  }),

  /** $1 test charge — runs a real $1 transaction through FluidPay to verify card processing */
  testCharge: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      const FLUIDPAY_API_URL = 'https://app.fluidpay.com';
      const FLUIDPAY_KEY = process.env.FLUIDPAY_SECRET_KEY || '';
      const nameParts = input.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const chargeRes = await fetch(`${FLUIDPAY_API_URL}/api/transaction`, {
        method: 'POST',
        headers: { 'Authorization': FLUIDPAY_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sale',
          amount: 100,
          currency: 'usd',
          payment_method: { token: input.token },
          billing_address: { first_name: firstName, last_name: lastName, email: input.email },
          order_meta: { description: 'MyDojo $1 Test Transaction' },
        }),
      });
      const chargeData = await chargeRes.json();
      // FluidPay returns response_code 100 for approved, status can be 'pending_settlement' or 'approved'
      const txData = chargeData.data;
      const isApproved = chargeData.status === 'success' && txData && txData.response_code === 100 && txData.response_body?.card?.processor_response_code === '00';
      if (!isApproved) {
        const msg = txData?.response_body?.card?.processor_response_text || txData?.response_body?.card?.response_text || chargeData.msg || 'Payment declined';
        throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
      }
      return {
        success: true,
        transactionId: txData?.id,
        last4: txData?.response_body?.card?.last_four,
        cardType: txData?.response_body?.card?.card_type,
        amount: '$1.00',
      };
    }),
  pno: router({
    submitRsvp: publicProcedure
      .input(z.object({
        parentName: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().email().optional(),
        studentNames: z.string().min(1),
        studentCount: z.number().int().min(1).max(10),
        bringingFriend: z.boolean(),
        friendName: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createPnoRsvp, checkPnoRsvpExists } = await import('./db');
        const alreadyRsvpd = await checkPnoRsvpExists(input.phone);
        if (alreadyRsvpd) {
          throw new TRPCError({ code: 'CONFLICT', message: "You've already RSVP'd for this event!" });
        }
        await createPnoRsvp({
          ...input,
          eventId: 'nerf-wars-2025-04-25',
        });
        return { success: true };
      }),
    getRsvps: protectedProcedure
      .query(async () => {
        const { getPnoRsvps } = await import('./db');
        return getPnoRsvps();
      }),
  }),

  // ─── Summer Camp Enrollments (admin) ──────────────────────────────────────
  campEnrollments: router({
    getAll: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const rows = await db
          .select()
          .from(schema.summerCampEnrollments)
          .orderBy(schema.summerCampEnrollments.createdAt);
        return rows.map(r => ({
          ...r,
          students: JSON.parse(r.students) as { name: string; age: number; dob?: string }[],
          weeks: JSON.parse(r.weeks) as string[],
        }));
      }),

    getStats: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'staff') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
        const rows = await db
          .select()
          .from(schema.summerCampEnrollments)
          .where(eq(schema.summerCampEnrollments.status, 'approved'));
        const totalEnrollments = rows.length;
        const totalStudents = rows.reduce((sum, r) => sum + r.studentCount, 0);
        const totalRevenueCents = rows.reduce((sum, r) => sum + r.amountCents, 0);
        const fullSummerCount = rows.filter(r => r.isFullSummer === 1).length;
        // Count enrollments per week
        const weekCounts: Record<string, number> = {};
        for (const row of rows) {
          const weeks = JSON.parse(row.weeks) as string[];
          for (const w of weeks) {
            weekCounts[w] = (weekCounts[w] || 0) + row.studentCount;
          }
        }
        return { totalEnrollments, totalStudents, totalRevenueCents, fullSummerCount, weekCounts };
      }),
  }),

  birthday: router({
    requestBooking: publicProcedure
      .input(z.object({
        packageId: z.string(),
        parentName: z.string().min(1),
        phone: z.string().min(7),
        email: z.string().email(),
        childName: z.string().min(1),
        childAge: z.string().optional(),
        partyDate: z.string().min(1),
        guestCount: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const packageNames: Record<string, string> = {
          ninja: 'Ninja Party ($199)',
          champion: 'Champion Party ($299)',
          blackbelt: 'Black Belt VIP ($449)',
        };
        const pkgName = packageNames[input.packageId] ?? input.packageId;
        const { notifyOwner } = await import('./_core/notification');
        await notifyOwner({
          title: `🎂 New Birthday Party Request — ${pkgName}`,
          content: [
            `Parent: ${input.parentName}`,
            `Phone: ${input.phone}`,
            `Email: ${input.email}`,
            `Birthday Child: ${input.childName}${input.childAge ? ` (Age ${input.childAge})` : ''}`,
            `Package: ${pkgName}`,
            `Preferred Date: ${input.partyDate}`,
            `Expected Guests: ${input.guestCount ?? 'Not specified'}`,
            input.message ? `Notes: ${input.message}` : '',
          ].filter(Boolean).join('\n'),
        });
        // Send confirmation SMS to parent (non-fatal)
        try {
          const { sendSms, normalizePhone } = await import('./sms800');
          const cleanPhone = normalizePhone(input.phone);
          if (cleanPhone) {
            await sendSms({
              to: cleanPhone,
              message: `Hi ${input.parentName.split(' ')[0]}! 🎉 We received your birthday party request for ${input.childName} on ${input.partyDate}. We'll contact you within 24 hours to confirm your date! Questions? Call (877) 469-3656. — MyDojo 🥋`,
            });
          }
        } catch (_) {
          // SMS failure is non-fatal
        }
        return { success: true };
      }),
  }),

  // ── Facebook Ads ─────────────────────────────────────────────────────────────
  facebookAds: router({
    getCampaigns: publicProcedure
      .input(z.object({
        datePreset: z.string().default('last_30d'),
      }))
      .query(async ({ input }) => {
        // Fetch campaigns from Meta via server-side MCP call
        const { execSync } = await import('child_process');

        const AD_ACCOUNT_ID = 'act_1144489619967778';

        // Get campaigns list
        const campaignsResult = JSON.parse(
          execSync(
            `manus-mcp-cli tool call meta_marketing_get_campaigns --server meta-marketing --input '${JSON.stringify({ ad_account_id: AD_ACCOUNT_ID, limit: 50 })}' 2>/dev/null && cat $(ls -t /tmp/manus-mcp/mcp_result_*.json | head -1)`,
            { encoding: 'utf8', timeout: 30000 }
          ).split('\n').slice(-1)[0] || '{}'
        );

        // Get insights
        const insightsResult = JSON.parse(
          execSync(
            `manus-mcp-cli tool call meta_marketing_get_insights --server meta-marketing --input '${JSON.stringify({ object_type: 'ad_account', object_id: AD_ACCOUNT_ID, level: 'campaign', date_preset: input.datePreset, limit: 50 })}' 2>/dev/null && cat $(ls -t /tmp/manus-mcp/mcp_result_*.json | head -1)`,
            { encoding: 'utf8', timeout: 30000 }
          ).split('\n').slice(-1)[0] || '{}'
        );

        const campaigns = campaignsResult?.result?.campaigns || [];
        const insights = insightsResult?.result?.insights || [];

        // Merge campaigns with insights
        const merged = campaigns.map((c: any) => {
          const insight = insights.find((i: any) => i.campaign_id === c.id) || {};
          const leads = insight.actions?.find((a: any) => a.action_type === 'lead')?.value;
          return {
            campaignId: c.id,
            campaignName: c.name,
            status: c.effective_status,
            spend: insight.spend || '0',
            impressions: insight.impressions || '0',
            linkClicks: insight.inline_link_clicks || '0',
            ctr: insight.ctr || null,
            cpm: insight.cpm || null,
            leads: leads ? parseInt(leads) : 0,
          };
        });

        return { campaigns: merged };
      }),
  }),

  // ── Private Lessons ─────────────────────────────────────────────────────────
  privateLessons: router({
    createCheckout: publicProcedure
      .input(z.object({
        instructorId: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const INSTRUCTORS: Record<string, { name: string; price: number }> = {
          'master-vincent-holmes': { name: 'Master Vincent Holmes', price: 200 },
          'sensei-kamil-ahmed': { name: 'Sensei Kamil Ahmed', price: 100 },
          'sensei-hector-diosdado': { name: 'Sensei Hector Diosdado', price: 100 },
          'sensei-dominique-griggs': { name: 'Sensei Dominique Griggs', price: 100 },
        };

        const instructor = INSTRUCTORS[input.instructorId];
        if (!instructor) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid instructor selected' });

        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-01-28.clover' as any });

        const origin = (ctx.req.headers.origin as string) || 'https://mydojoma.com';

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'usd',
              product_data: {
                name: `3 Private Classes — ${instructor.name}`,
                description: 'Three one-on-one private martial arts sessions. Classes valid for 60 days.',
              },
              unit_amount: instructor.price * 100,
            },
            quantity: 1,
          }],
          metadata: {
            type: 'private_lessons',
            instructor_id: input.instructorId,
            instructor_name: instructor.name,
          },
          allow_promotion_codes: true,
          success_url: `${origin}/private-lessons/success?instructor=${encodeURIComponent(instructor.name)}`,
          cancel_url: `${origin}/private-lessons`,
        });

        return { checkoutUrl: session.url };
      }),
  }),
});
export type AppRouter = typeof appRouter;

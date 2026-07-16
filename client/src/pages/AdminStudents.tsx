import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { ParentChildProfilesSection } from "@/components/ParentChildProfilesSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, MoreVertical, Users, UserCheck, UserX, Clock, Pencil, Camera, X, Upload, Award, ChevronRight, History, Mail, CheckCircle, CalendarPlus, CalendarCheck, CreditCard } from "lucide-react";
import { UpdatePaymentMethodModal } from "@/components/UpdatePaymentMethodModal";
import { toast } from "sonner";
import { BELT_RANKS as BELT_RANKS_CONST, nextBeltRank, requiresBeltExam } from "@shared/const";

const PROGRAMS = ["all", "Foundation", "Black Belt", "Leadership", "Little Ninjas", "Dragon Kids", "Teens", "Adult Karate", "Kickboxing", "After School", "Summer Camp"];
const STATUSES = ["all", "active", "pending", "inactive", "cancelled"];

const BELT_RANKS = BELT_RANKS_CONST as readonly string[];

const statusColor: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  inactive: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

/** Belt color swatch for visual display */
const BELT_COLORS: Record<string, string> = {
  "No Belt":           "#e5e7eb",
  "White Belt":        "#f9fafb",
  "Yellow Belt":       "#fbbf24",
  "Orange Belt":       "#f97316",
  "Green Belt":        "#22c55e",
  "Advanced Green":    "#16a34a",
  "Blue Belt":         "#3b82f6",
  "Advanced Blue":     "#1d4ed8",
  "Purple Belt":       "#a855f7",
  "Advanced Purple":   "#7e22ce",
  "Brown Belt":        "#92400e",
  "Advanced Brown":    "#78350f",
  "Probationary Black":"#374151",
  "Black Belt 1st Dan":"#111827",
  "Black Belt 2nd Dan":"#111827",
  "Black Belt 3rd Dan":"#111827",
  "Black Belt 4th Dan":"#111827",
  "Black Belt 5th Dan":"#111827",
  "Black Belt 6th Dan":"#111827",
};

type Student = {
  id: number;
  name: string;
  studentName?: string | null;
  email: string;
  phone: string;
  program: string;
  status: string;
  beltRank?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  photoUrl?: string | null;
  location: string;
  createdAt: Date;
};

type EditForm = {
  customerName: string;
  studentName: string;
  customerEmail: string;
  customerPhone: string;
  dateOfBirth: string;
  beltRank: string;
  status: string;
};

/** Initials avatar for students without a photo */
function InitialsAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? "")
    .join("");
  const colors = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-green-500", "bg-teal-500", "bg-blue-500", "bg-indigo-500",
    "bg-purple-500", "bg-pink-500",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sizeClass = size === "sm" ? "w-8 h-8 text-xs" : "w-16 h-16 text-lg";
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials || "?"}
    </div>
  );
}

/** Small belt color dot */
function BeltDot({ belt, size = 14 }: { belt: string; size?: number }) {
  const color = BELT_COLORS[belt] ?? "#e5e7eb";
  const border = belt === "White Belt" || belt === "No Belt" ? "1px solid #d1d5db" : "none";
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        border,
        flexShrink: 0,
      }}
    />
  );
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("all");
  const [status, setStatus] = useState("all");

  // Edit modal state
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    customerName: "",
    studentName: "",
    customerEmail: "",
    customerPhone: "",
    dateOfBirth: "",
    beltRank: "No Belt",
    status: "active",
  });

  // Photo upload state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<{ base64: string; mimeType: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Promote Belt dialog state
  const [promoteStudent, setPromoteStudent] = useState<Student | null>(null);
  const [promoteNotes, setPromoteNotes] = useState("");
  const [showPromotionHistory, setShowPromotionHistory] = useState<Student | null>(null);

  // Book Appointment dialog state
  const [bookAptStudent, setBookAptStudent] = useState<Student | null>(null);
  const [updateCardStudent, setUpdateCardStudent] = useState<{
    id: number;
    customerName: string;
    fluidpayCustomerId?: string | null;
    stripeCustomerId?: string | null;
  } | null>(null);
  const [aptDate, setAptDate] = useState("");
  const [aptTime, setAptTime] = useState("12:00");
  const [aptInstructor, setAptInstructor] = useState("");
  const [aptNotes, setAptNotes] = useState("");

  const bookAppointment = trpc.studentAppointments.book.useMutation({
    onSuccess: () => {
      toast.success("Appointment booked! Student will receive an SMS reminder 2 hours before class.");
      setBookAptStudent(null);
      setAptDate("");
      setAptTime("12:00");
      setAptInstructor("");
      setAptNotes("");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: students = [], isLoading, refetch } = trpc.admin.getAllStudents.useQuery({
    search: search || undefined,
    program: program !== "all" ? program : undefined,
    status: status !== "all" ? status : undefined,
  });

  const updateStatus = trpc.admin.updateStudentStatus.useMutation({
    onSuccess: () => {
      toast.success("Student status updated");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStudent = trpc.admin.updateStudent.useMutation({
    onSuccess: () => {
      toast.success("Student updated successfully");
      setEditStudent(null);
      setPhotoPreview(null);
      setPhotoFile(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadPhoto = trpc.admin.uploadStudentPhoto.useMutation({
    onError: (err) => toast.error(`Photo upload failed: ${err.message}`),
  });

  const resendBeltExamEmail = trpc.admin.resendBeltExamEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Exam eligibility email resent successfully!", { duration: 5000 });
      } else {
        toast.error("Email delivery failed — please try again.");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const promoteBelt = trpc.admin.promoteBelt.useMutation({
    onSuccess: (data) => {
      const examNote = data.requiresExam
        ? ` A belt exam ($49) is required to advance further.`
        : "";
      toast.success(
        `🥋 ${data.studentName} promoted from ${data.fromBelt} → ${data.toBelt}!${examNote}`,
        { duration: 6000 }
      );
      setPromoteStudent(null);
      setPromoteNotes("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Promotion history query — only runs when showPromotionHistory is set
  const { data: promotionHistory = [], isLoading: historyLoading } =
    trpc.admin.getBeltPromotionHistory.useQuery(
      { enrollmentId: showPromotionHistory?.id ?? 0 },
      { enabled: !!showPromotionHistory }
    );

  const openEdit = (student: Student) => {
    setEditStudent(student);
    setEditForm({
      customerName: student.name,
      studentName: student.studentName ?? "",
      customerEmail: student.email ?? "",
      customerPhone: student.phone ?? "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split("T")[0] : "",
      beltRank: student.beltRank ?? "No Belt",
      status: student.status,
    });
    setPhotoPreview(student.photoUrl ?? null);
    setPhotoFile(null);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, or GIF images are allowed");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setPhotoFile({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!editStudent) return;
    if (!editForm.customerName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (photoFile) {
      try {
        await uploadPhoto.mutateAsync({
          id: editStudent.id,
          imageBase64: photoFile.base64,
          mimeType: photoFile.mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
        });
      } catch {
        return;
      }
    }

    updateStudent.mutate({
      id: editStudent.id,
      customerName: editForm.customerName.trim(),
      studentName: editForm.studentName.trim() || undefined,
      customerEmail: editForm.customerEmail.trim() || undefined,
      customerPhone: editForm.customerPhone.trim() || undefined,
      dateOfBirth: editForm.dateOfBirth || undefined,
      beltRank: editForm.beltRank as Parameters<typeof updateStudent.mutate>[0]["beltRank"],
      status: editForm.status as "pending" | "active" | "cancelled" | "completed" | "failed",
    });
  };

  const handlePromote = () => {
    if (!promoteStudent) return;
    promoteBelt.mutate({
      enrollmentId: promoteStudent.id,
      notes: promoteNotes.trim() || undefined,
    });
  };

  const isSaving = updateStudent.isPending || uploadPhoto.isPending;

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === "active").length,
    pending: students.filter(s => s.status === "pending").length,
    inactive: students.filter(s => s.status === "inactive" || s.status === "cancelled").length,
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members &amp; Students</h1>
          <p className="text-sm text-gray-500 mt-1">Active paying members — each entry is a parent enrolled on behalf of their student</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><Users className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total}</p></div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg"><UserCheck className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Active</p><p className="text-xl font-bold">{stats.active}</p></div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-yellow-50 p-2 rounded-lg"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-xl font-bold">{stats.pending}</p></div>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="bg-gray-50 p-2 rounded-lg"><UserX className="h-5 w-5 text-gray-500" /></div>
            <div><p className="text-xs text-gray-500">Inactive</p><p className="text-xl font-bold">{stats.inactive}</p></div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by parent, student name, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAMS.map(p => (
                <SelectItem key={p} value={p}>{p === "all" ? "All Programs" : p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s}>{s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Member (Parent)</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Belt</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-400">Loading members...</TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-gray-400">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                students.map(student => {
                  const nextBelt = nextBeltRank(student.beltRank ?? "No Belt");
                  return (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" loading="lazy" />
                          ) : (
                            <InitialsAvatar name={student.name} size="sm" />
                          )}
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 text-sm">
                        {student.studentName ? (
                          <span className="font-medium">{student.studentName}</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{student.email}</div>
                        {student.phone && <div className="text-xs text-gray-400">{student.phone}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{student.program}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <BeltDot belt={student.beltRank ?? "No Belt"} />
                            <span className="text-gray-700 text-sm">{student.beltRank ?? "No Belt"}</span>
                          </div>
                          {/* Exam status badges */}
                          {student.beltExamFeePaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 w-fit">
                              <CheckCircle className="h-2.5 w-2.5" /> Exam Paid
                            </span>
                          ) : student.beltExamEligible ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 w-fit">
                              <Mail className="h-2.5 w-2.5" /> Exam Eligible
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {student.dateOfBirth ? calculateAge(student.dateOfBirth) : student.age ? `${student.age} yrs` : "—"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[student.status] ?? "bg-gray-100 text-gray-700"}`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(student as any).source === 'stripe' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Stripe</span>
                        ) : (student as any).source === 'fluidpay' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">FluidPay</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Manual</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(student as Student)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setBookAptStudent(student as Student);
                                setAptDate(new Date().toISOString().slice(0, 10));
                              }}
                              className="text-blue-700 focus:text-blue-800 focus:bg-blue-50"
                            >
                              <CalendarPlus className="h-4 w-4 mr-2 text-blue-600" />
                              Book Appointment
                            </DropdownMenuItem>
                            {/* Promote Belt — only shown if there's a next belt */}
                            {nextBelt && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => { setPromoteStudent(student as Student); setPromoteNotes(""); }}
                                  className="text-amber-700 focus:text-amber-800 focus:bg-amber-50"
                                >
                                  <Award className="h-4 w-4 mr-2 text-amber-600" />
                                  Promote Belt
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setShowPromotionHistory(student as Student)}
                                  className="text-gray-600"
                                >
                                  <History className="h-4 w-4 mr-2" />
                                  Promotion History
                                </DropdownMenuItem>
                                {/* Resend Exam Email — only shown for exam-eligible students who haven't paid yet */}
                                {requiresBeltExam(student.beltRank ?? 'No Belt') && !student.beltExamFeePaid && (
                                  <DropdownMenuItem
                                    onClick={() => resendBeltExamEmail.mutate({ enrollmentId: student.id })}
                                    disabled={resendBeltExamEmail.isPending}
                                    className="text-green-700 focus:text-green-800 focus:bg-green-50"
                                  >
                                    <Mail className="h-4 w-4 mr-2 text-green-600" />
                                    {resendBeltExamEmail.isPending ? "Sending…" : "Resend Exam Email"}
                                  </DropdownMenuItem>
                                )}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            {/* Update Card — only shown if there's a payment processor linked */}
                            {((student as any).fluidpayCustomerId || (student as any).stripeCustomerId) && (
                              <DropdownMenuItem
                                onClick={() => setUpdateCardStudent({
                                  id: student.id,
                                  customerName: student.name,
                                  fluidpayCustomerId: (student as any).fluidpayCustomerId,
                                  stripeCustomerId: (student as any).stripeCustomerId,
                                })}
                                className="text-red-700 focus:text-red-800 focus:bg-red-50"
                              >
                                <CreditCard className="h-4 w-4 mr-2 text-red-600" />
                                Update Card
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {(["active", "pending", "inactive", "cancelled"] as const).filter(s => s !== student.status).map(s => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => updateStatus.mutate({ id: student.id, status: s })}
                              >
                                Mark as {s.charAt(0).toUpperCase() + s.slice(1)}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Parent-Submitted Child Profiles ─────────────────────────────────────────── */}
      <ParentChildProfilesSection />

      {/* ── Edit Student Modal ─────────────────────────────────────────────────── */}
      <Dialog open={!!editStudent} onOpenChange={open => { if (!open) { setEditStudent(null); setPhotoPreview(null); setPhotoFile(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-gray-500" />
              Edit Student
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm" loading="lazy" />
                ) : (
                  <div className="w-20 h-20">
                    <InitialsAvatar name={editForm.customerName || "?"} size="md" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  title="Change photo"
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  {photoPreview ? "Change Photo" : "Upload Photo"}
                </Button>
                {photoFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setPhotoPreview(editStudent?.photoUrl ?? null); setPhotoFile(null); }}
                    className="text-xs text-gray-500"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-400">JPEG, PNG, WebP or GIF — max 5 MB</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </div>

            <div className="border-t" />

            {/* Full Name (Parent/Guardian) */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-name">Parent / Guardian Name <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                value={editForm.customerName}
                onChange={e => setEditForm(f => ({ ...f, customerName: e.target.value }))}
                placeholder="e.g. John Smith"
              />
            </div>

            {/* Student Name */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-student-name">
                Student Name
                <span className="ml-1.5 text-xs text-gray-400 font-normal">(the child / participant)</span>
              </Label>
              <Input
                id="edit-student-name"
                value={editForm.studentName}
                onChange={e => setEditForm(f => ({ ...f, studentName: e.target.value }))}
                placeholder="e.g. Emma Smith"
              />
            </div>

            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.customerEmail}
                onChange={e => setEditForm(f => ({ ...f, customerEmail: e.target.value }))}
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editForm.customerPhone}
                onChange={e => setEditForm(f => ({ ...f, customerPhone: e.target.value }))}
                placeholder="(555) 000-0000"
              />
            </div>

            {/* Date of Birth */}
            <div className="grid gap-1.5">
              <Label htmlFor="edit-dob">
                Date of Birth
                {editForm.dateOfBirth && (
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    ({calculateAge(editForm.dateOfBirth)})
                  </span>
                )}
              </Label>
              <Input
                id="edit-dob"
                type="date"
                value={editForm.dateOfBirth}
                onChange={e => setEditForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Belt Rank */}
            <div className="grid gap-1.5">
              <Label>Belt Rank</Label>
              <Select value={editForm.beltRank} onValueChange={v => setEditForm(f => ({ ...f, beltRank: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select belt rank" />
                </SelectTrigger>
                <SelectContent>
                  {BELT_RANKS.map(rank => (
                    <SelectItem key={rank} value={rank}>{rank}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-1.5">
              <Label>Membership Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setEditStudent(null); setPhotoPreview(null); setPhotoFile(null); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSaving ? (uploadPhoto.isPending ? "Uploading photo…" : "Saving…") : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Promote Belt Confirmation Dialog ──────────────────────────────────── */}
      <Dialog
        open={!!promoteStudent}
        onOpenChange={open => { if (!open) { setPromoteStudent(null); setPromoteNotes(""); } }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <Award className="h-5 w-5 text-amber-600" />
              Promote Belt Rank
            </DialogTitle>
            <DialogDescription>
              This will advance the student's belt and reset their stripe counter to zero.
            </DialogDescription>
          </DialogHeader>

          {promoteStudent && (() => {
            const currentBelt = promoteStudent.beltRank ?? "No Belt";
            const nextBelt = nextBeltRank(currentBelt);
            const examRequired = nextBelt ? requiresBeltExam(nextBelt) : false;
            const studentLabel = promoteStudent.studentName || promoteStudent.name;

            return (
              <div className="space-y-5 py-2">
                {/* Student identity */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  {promoteStudent.photoUrl ? (
                    <img
                      src={promoteStudent.photoUrl}
                      alt={studentLabel}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200" loading="lazy" />
                  ) : (
                    <InitialsAvatar name={studentLabel} size="sm" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{studentLabel}</p>
                    <p className="text-xs text-gray-500">{promoteStudent.program}</p>
                  </div>
                </div>

                {/* Belt transition visual */}
                <div className="flex items-center justify-center gap-3 py-4">
                  {/* Current belt */}
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full border-2 border-gray-200 shadow-sm"
                      style={{ background: BELT_COLORS[currentBelt] ?? "#e5e7eb" }}
                    />
                    <span className="text-xs font-medium text-gray-600 text-center max-w-[80px]">{currentBelt}</span>
                  </div>

                  <ChevronRight className="h-6 w-6 text-amber-500 flex-shrink-0" />

                  {/* Next belt */}
                  {nextBelt ? (
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-full border-2 border-amber-300 shadow-md ring-2 ring-amber-200"
                        style={{ background: BELT_COLORS[nextBelt] ?? "#e5e7eb" }}
                      />
                      <span className="text-xs font-semibold text-amber-700 text-center max-w-[80px]">{nextBelt}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Top rank</span>
                  )}
                </div>

                {/* Exam warning */}
                {examRequired && nextBelt && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    <span className="text-blue-500 mt-0.5">ℹ️</span>
                    <span>
                      <strong>{nextBelt}</strong> requires a belt exam. The student will need to pay the $49 exam fee to advance beyond this rank.
                    </span>
                  </div>
                )}

                {/* Stripe reset notice */}
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <span className="mt-0.5">🔄</span>
                  <span>
                    The student's stripe counter will be <strong>reset to zero</strong> for the new belt rank. This action cannot be undone.
                  </span>
                </div>

                {/* Optional notes */}
                <div className="grid gap-1.5">
                  <Label htmlFor="promote-notes">
                    Notes <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </Label>
                  <Textarea
                    id="promote-notes"
                    value={promoteNotes}
                    onChange={e => setPromoteNotes(e.target.value)}
                    placeholder="e.g. Awarded at Saturday belt ceremony, June 7th"
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setPromoteStudent(null); setPromoteNotes(""); }}
              disabled={promoteBelt.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePromote}
              disabled={promoteBelt.isPending || !nextBeltRank(promoteStudent?.beltRank ?? "No Belt")}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {promoteBelt.isPending ? "Promoting…" : "Confirm Promotion"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Promotion History Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={!!showPromotionHistory}
        onOpenChange={open => { if (!open) setShowPromotionHistory(null); }}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-gray-500" />
              Belt Promotion History
              {showPromotionHistory && (
                <span className="text-gray-500 font-normal text-sm ml-1">
                  — {showPromotionHistory.studentName || showPromotionHistory.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {historyLoading ? (
              <p className="text-center text-gray-400 py-8">Loading history…</p>
            ) : promotionHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No belt promotions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promotionHistory.map((record) => (
                  <div key={record.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                      <BeltDot belt={record.fromBelt} size={12} />
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      <BeltDot belt={record.toBelt} size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {record.fromBelt} → {record.toBelt}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {record.classesAtPromotion} classes at time of promotion
                      </p>
                      {record.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{record.notes}"</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        By {record.promotedByName} · {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromotionHistory(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Book Appointment Dialog */}
      <Dialog open={!!bookAptStudent} onOpenChange={(open) => { if (!open) setBookAptStudent(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
              Book Appointment
            </DialogTitle>
            <DialogDescription>
              Schedule a class for <strong>{bookAptStudent?.name}</strong>. They will receive an SMS reminder 2 hours before class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="apt-date">Date *</Label>
                <Input
                  id="apt-date"
                  type="date"
                  value={aptDate}
                  onChange={(e) => setAptDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="apt-time">Time *</Label>
                <Input
                  id="apt-time"
                  type="time"
                  value={aptTime}
                  onChange={(e) => setAptTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="apt-program">Program</Label>
              <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-2">
                {bookAptStudent?.program ?? "—"}
              </p>
            </div>
            <div>
              <Label htmlFor="apt-instructor">Instructor (optional)</Label>
              <Input
                id="apt-instructor"
                placeholder="e.g. Sensei Mike"
                value={aptInstructor}
                onChange={(e) => setAptInstructor(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="apt-notes">Notes (optional)</Label>
              <Textarea
                id="apt-notes"
                placeholder="Any special notes for this appointment..."
                value={aptNotes}
                onChange={(e) => setAptNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <p className="text-xs text-gray-500 bg-blue-50 rounded p-2">
              📱 An SMS reminder will automatically be sent to {bookAptStudent?.phone ?? "the student"} 2 hours before the class.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookAptStudent(null)}>Cancel</Button>
            <Button
              disabled={!aptDate || !aptTime || bookAppointment.isPending}
              onClick={() => {
                if (!bookAptStudent || !aptDate || !aptTime) return;
                const scheduledTime = new Date(`${aptDate}T${aptTime}:00`);
                bookAppointment.mutate({
                  studentId: bookAptStudent.id,
                  studentName: bookAptStudent.name,
                  studentPhone: bookAptStudent.phone ?? "",
                  program: bookAptStudent.program,
                  scheduledTime,
                  instructor: aptInstructor || undefined,
                  notes: aptNotes || undefined,
                });
              }}
            >
              {bookAppointment.isPending ? "Booking…" : "Book Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Update Payment Method Modal ──────────────────────────────────────── */}
      <UpdatePaymentMethodModal
        enrollment={updateCardStudent}
        open={!!updateCardStudent}
        onClose={() => setUpdateCardStudent(null)}
      />
    </AdminLayout>
  );
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

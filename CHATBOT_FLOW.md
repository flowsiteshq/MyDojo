# Enhanced Chatbot Conversation Flow

## Flow Steps

### 1. Greeting
**Bot:** "Hey there! 👋 Ready to start your martial arts journey? I can help you sign up for a FREE trial class at MyDojo!"

### 2. Collect Name
**Bot:** "What's your name?"
**User:** [enters name]

### 3. Collect Email
**Bot:** "Nice to meet you, [Name]! What's your email address?"
**User:** [enters email]

### 4. Collect Phone
**Bot:** "Great! What's the best phone number to reach you?"
**User:** [enters phone]

### 5. Who Are Lessons For? (NEW)
**Bot:** "Perfect! Now, who are these lessons for?"
**Options:**
- Myself
- My son
- My daughter
- My family (multiple people)

### 6. Age Collection (NEW - conditional based on answer)

#### If "Myself":
**Bot:** "How old are you?"
**User:** [enters age]
→ Recommend program based on age

#### If "My son" or "My daughter":
**Bot:** "How old is your [son/daughter]?"
**User:** [enters age]
→ Recommend program based on age

#### If "My family":
**Bot:** "Great! Let's get everyone signed up. How many family members want to train?"
**User:** [enters number]

**Bot:** "Perfect! Let me collect ages for each person."
For each person:
- "Person 1: What's their age?"
- "Person 2: What's their age?"
- etc.

### 7. Program Recommendation (NEW)
Based on collected ages, recommend appropriate programs:

**Age-based recommendations:**
- **3-5 years:** Little Ninjas - "A 'stealthy' way to teach children life skills through fun martial arts activities!"
- **5-12 years:** Core Kids - "Perfect for building confidence, discipline, and self-defense skills in a safe environment!"
- **12-17 years:** Teens - "High-energy training focused on fitness, self-defense, and building character!"
- **18+ years:** Adults or Kickboxing - "Get in the best shape of your life while learning real self-defense!"

**Bot:** "Based on the age[s], I recommend: [Program Name(s)] - [Description]"

### 8. Location Selection
**Bot:** "Which location works best for you?"
**Options:**
- Tomball HQ
- [Other locations if available]
- Or allow text input

### 9. Show Available Schedule (NEW - Future Enhancement)
**Bot:** "Here are the available class times for [Program] at [Location]:"
- Monday 4:00 PM - 5:00 PM
- Wednesday 4:00 PM - 5:00 PM
- Saturday 10:00 AM - 11:00 AM

**Bot:** "Which time works best for you?"

### 10. Contact Preference
**Bot:** "How would you prefer we contact you?"
**Options:**
- 📧 Email
- 📞 Phone call
- 💬 Text message

### 11. Additional Notes
**Bot:** "Awesome! Is there anything else you'd like us to know? (Or just type 'no' to finish)"
**User:** [enters message or "no"]

### 12. Submission
- Save lead(s) to MyDojo database
- Attempt to send to Dojo Flow
- Show success message

**Bot:** "Perfect! Your free trial is all set. We'll reach out to you shortly to schedule your first class. Get ready to start your martial arts journey! 🥋"

## Data Structure for Family Bookings

```typescript
interface FamilyMember {
  age: number;
  recommendedProgram: string;
}

interface LeadData {
  name: string;
  email: string;
  phone: string;
  lessonsFor: "myself" | "son" | "daughter" | "family";
  familyMembers: FamilyMember[];
  location: string;
  preferredContactMethod: "email" | "phone" | "text";
  message?: string;
}
```

## Program Recommendation Logic

```typescript
function recommendProgram(age: number): string {
  if (age >= 3 && age <= 5) return "Little Ninjas";
  if (age >= 5 && age <= 12) return "Core Kids";
  if (age >= 12 && age <= 17) return "Teens";
  if (age >= 18) return "Adults";
  return "Not Sure";
}
```

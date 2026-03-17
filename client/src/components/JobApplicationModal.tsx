import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2 } from "lucide-react";

interface JobApplicationModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultPosition?: string;
}

export function JobApplicationModal({ trigger, isOpen, onOpenChange, defaultPosition }: JobApplicationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSuccess(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] bg-white text-black max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-bold text-center">
            {isSuccess ? "APPLICATION RECEIVED!" : "JOIN OUR TEAM"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {isSuccess 
              ? "Thank you for applying! We will review your application and get back to you if your qualifications match our needs."
              : "Tell us a bit about yourself and why you'd be a great fit for MyDojo."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-white font-heading uppercase tracking-wider mt-4"
              onClick={() => onOpenChange?.(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs font-bold uppercase text-gray-500">First Name</Label>
                <Input id="firstName" required placeholder="John" className="bg-gray-50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs font-bold uppercase text-gray-500">Last Name</Label>
                <Input id="lastName" required placeholder="Doe" className="bg-gray-50" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-500">Email</Label>
              <Input id="email" type="email" required placeholder="john@example.com" className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold uppercase text-gray-500">Phone</Label>
              <Input id="phone" type="tel" required placeholder="(555) 123-4567" className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-xs font-bold uppercase text-gray-500">Position Applying For</Label>
              <Select defaultValue={defaultPosition} required>
                <SelectTrigger className="bg-gray-50">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Child Care Director">Child Care Director</SelectItem>
                  <SelectItem value="After School Counselor">After School Counselor</SelectItem>
                  <SelectItem value="Van Driver">Van Driver</SelectItem>
                  <SelectItem value="Martial Arts Instructor">Martial Arts Instructor</SelectItem>
                  <SelectItem value="Program Director">Program Director</SelectItem>
                  <SelectItem value="Front Desk Associate">Front Desk Associate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience" className="text-xs font-bold uppercase text-gray-500">Relevant Experience</Label>
              <Textarea id="experience" required placeholder="Briefly describe your relevant experience..." className="bg-gray-50 min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-xs font-bold uppercase text-gray-500">LinkedIn / Portfolio URL (Optional)</Label>
              <Input id="linkedin" type="url" placeholder="https://linkedin.com/in/..." className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume" className="text-xs font-bold uppercase text-gray-500">Resume / CV</Label>
              <div className="flex items-center gap-2">
                <Input id="resume" type="file" accept=".pdf,.doc,.docx" className="bg-gray-50 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
              <p className="text-[10px] text-gray-400">Accepted formats: PDF, DOC, DOCX (Max 5MB)</p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white h-12 font-heading uppercase tracking-wider text-lg mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
            
            <p className="text-[10px] text-center text-gray-400 mt-2">
              By submitting this form, you certify that the information provided is accurate.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

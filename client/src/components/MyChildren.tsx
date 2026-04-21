import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, Pencil, Trash2, Plus, User, X, Check } from "lucide-react";
import { toast } from "sonner";

const PROGRAMS = [
  "Little Ninjas",
  "Dragon Kids",
  "Teens",
  "Adult Karate",
  "Kickboxing",
  "After School",
  "Summer Camp",
  "Not Sure",
] as const;

type Program = typeof PROGRAMS[number];

interface ChildFormData {
  name: string;
  dateOfBirth: string;
  program: Program;
  notes: string;
}

interface ChildProfile {
  id: number;
  userId: number;
  name: string;
  dateOfBirth: string | null;
  program: Program;
  photoUrl: string | null;
  photoKey: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function getAge(dob: string | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age >= 0 ? `${age} yrs` : "";
}

function getProgramColor(program: Program): string {
  const colors: Record<string, string> = {
    "Little Ninjas": "bg-yellow-100 text-yellow-800",
    "Dragon Kids": "bg-orange-100 text-orange-800",
    "Teens": "bg-blue-100 text-blue-800",
    "Adult Karate": "bg-red-100 text-red-800",
    "Kickboxing": "bg-purple-100 text-purple-800",
    "After School": "bg-green-100 text-green-800",
    "Summer Camp": "bg-cyan-100 text-cyan-800",
    "Not Sure": "bg-gray-100 text-gray-600",
  };
  return colors[program] ?? "bg-gray-100 text-gray-600";
}

interface ChildCardProps {
  child: ChildProfile;
  isDark: boolean;
  onEdit: (child: ChildProfile) => void;
  onDelete: (id: number, name: string) => void;
}

function ChildCard({ child, isDark, onEdit, onDelete }: ChildCardProps) {
  const age = getAge(child.dateOfBirth);
  return (
    <div
      className={`relative rounded-2xl p-4 flex flex-col items-center gap-3 border transition-all ${
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/8"
          : "bg-white border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Photo */}
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
        {child.photoUrl ? (
          <img
            src={child.photoUrl}
            alt={child.name}
            className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <User className={`w-10 h-10 ${isDark ? "text-white/30" : "text-gray-400"}`} />
        )}
      </div>

      {/* Name & Age */}
      <div className="text-center">
        <p className={`font-bold text-lg leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          {child.name}
        </p>
        {age && (
          <p className={`text-sm ${isDark ? "text-white/50" : "text-gray-500"}`}>{age}</p>
        )}
      </div>

      {/* Program badge */}
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getProgramColor(child.program)}`}>
        {child.program}
      </span>

      {/* Notes */}
      {child.notes && (
        <p className={`text-xs text-center line-clamp-2 ${isDark ? "text-white/40" : "text-gray-500"}`}>
          {child.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onEdit(child)}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
          }`}
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(child.id, child.name)}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? "hover:bg-red-900/30 text-white/40 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-600"
          }`}
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface ChildFormDialogProps {
  open: boolean;
  onClose: () => void;
  editing: ChildProfile | null;
  isDark: boolean;
}

function ChildFormDialog({ open, onClose, editing, isDark }: ChildFormDialogProps) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState<ChildFormData>({
    name: editing?.name ?? "",
    dateOfBirth: editing?.dateOfBirth ?? "",
    program: (editing?.program as Program) ?? "Not Sure",
    notes: editing?.notes ?? "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(editing?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset form when dialog opens/editing changes
  const resetForm = useCallback(() => {
    setForm({
      name: editing?.name ?? "",
      dateOfBirth: editing?.dateOfBirth ?? "",
      program: (editing?.program as Program) ?? "Not Sure",
      notes: editing?.notes ?? "",
    });
    setPhotoPreview(editing?.photoUrl ?? null);
    setPhotoFile(null);
    setCameraOpen(false);
  }, [editing]);

  // Reset on open
  useState(() => { if (open) resetForm(); });

  const createMutation = trpc.childProfiles.create.useMutation({
    onSuccess: () => {
      utils.childProfiles.list.invalidate();
      toast.success(`${form.name}'s profile has been saved.`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.childProfiles.update.useMutation({
    onSuccess: () => {
      utils.childProfiles.list.invalidate();
      toast.success(`${form.name}'s profile has been updated.`);
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadPhotoMutation = trpc.childProfiles.uploadPhoto.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Please select an image under 5MB.");
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      // Wait for video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error("Could not access camera. Please upload a photo instead.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
      setPhotoFile(file);
      setPhotoPreview(canvas.toDataURL("image/jpeg"));
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter the child's name.");
      return;
    }
    setUploading(true);
    try {
      let photoUrl: string | undefined;
      let photoKey: string | undefined;

      // Upload photo if a new one was selected
      if (photoFile) {
        const reader = new FileReader();
        const base64Data = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result.split(",")[1]); // strip data:image/...;base64,
          };
          reader.onerror = reject;
          reader.readAsDataURL(photoFile);
        });
        const uploaded = await uploadPhotoMutation.mutateAsync({
          fileName: photoFile.name || "photo.jpg",
          contentType: photoFile.type || "image/jpeg",
          base64Data,
        });
        photoUrl = uploaded.url;
        photoKey = uploaded.key;
      }

      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          name: form.name.trim(),
          dateOfBirth: form.dateOfBirth || null,
          program: form.program,
          notes: form.notes || null,
          ...(photoUrl ? { photoUrl, photoKey } : {}),
        });
      } else {
        await createMutation.mutateAsync({
          name: form.name.trim(),
          dateOfBirth: form.dateOfBirth || undefined,
          program: form.program,
          notes: form.notes || undefined,
          photoUrl,
          photoKey,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const inputClass = isDark
    ? "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-red-500"
    : "bg-white border-gray-300 text-gray-900 focus:border-red-500";

  const labelClass = isDark ? "text-white/70" : "text-gray-600";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { stopCamera(); onClose(); } }}>
      <DialogContent className={`max-w-md ${isDark ? "bg-zinc-900 border-white/10 text-white" : "bg-white"}`}>
        <DialogHeader>
          <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
            {editing ? `Edit ${editing.name}` : "Add a Child"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Photo section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {cameraOpen ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
              ) : photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <User className={`w-12 h-12 ${isDark ? "text-white/30" : "text-gray-400"}`} />
              )}
              {photoPreview && !cameraOpen && (
                <button
                  onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            {cameraOpen ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={capturePhoto} className="bg-red-600 hover:bg-red-700 text-white gap-1">
                  <Check className="w-4 h-4" /> Capture
                </Button>
                <Button size="sm" variant="outline" onClick={stopCamera} className={isDark ? "border-white/20 text-white hover:bg-white/10" : ""}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startCamera}
                  className={`gap-1 ${isDark ? "border-white/20 text-white hover:bg-white/10 bg-transparent" : ""}`}
                >
                  <Camera className="w-4 h-4" /> Camera
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className={`gap-1 ${isDark ? "border-white/20 text-white hover:bg-white/10 bg-transparent" : ""}`}
                >
                  <Upload className="w-4 h-4" /> Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1">
            <Label className={labelClass}>Child's Name *</Label>
            <Input
              className={inputClass}
              placeholder="First and last name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1">
            <Label className={labelClass}>Date of Birth</Label>
            <Input
              type="date"
              className={inputClass}
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Program */}
          <div className="space-y-1">
            <Label className={labelClass}>Program Interest</Label>
            <Select
              value={form.program}
              onValueChange={(v) => setForm((f) => ({ ...f, program: v as Program }))}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROGRAMS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className={labelClass}>Notes (optional)</Label>
            <Input
              className={inputClass}
              placeholder="Any info for the instructor..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSubmit}
              disabled={uploading || createMutation.isPending || updateMutation.isPending}
            >
              {uploading || createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editing ? "Save Changes" : "Add Child"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { stopCamera(); onClose(); }}
              className={isDark ? "border-white/20 text-white hover:bg-white/10 bg-transparent" : ""}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MyChildrenProps {
  isDark: boolean;
}

export function MyChildren({ isDark }: MyChildrenProps) {
  const { data: children, isLoading } = trpc.childProfiles.list.useQuery();
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChildProfile | null>(null);

  const deleteMutation = trpc.childProfiles.delete.useMutation({
    onSuccess: (_, vars) => {
      utils.childProfiles.list.invalidate();
      toast.success("Profile removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleEdit = (child: ChildProfile) => {
    setEditing(child);
    setDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Remove ${name}'s profile?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const cardBg = isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSecondary = isDark ? "text-white/60" : "text-gray-500";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${textPrimary}`}>My Children</h2>
          <p className={`text-sm ${textSecondary}`}>
            Add your kids so we can personalize their experience
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="bg-red-600 hover:bg-red-700 text-white gap-1"
          size="sm"
        >
          <Plus className="w-4 h-4" /> Add Child
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={`text-center py-12 ${textSecondary}`}>Loading...</div>
      )}

      {/* Empty state */}
      {!isLoading && (!children || children.length === 0) && (
        <div
          className={`rounded-2xl border-2 border-dashed p-10 flex flex-col items-center gap-4 ${
            isDark ? "border-white/10" : "border-gray-200"
          }`}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? "bg-white/5" : "bg-gray-100"}`}>
            <User className={`w-8 h-8 ${isDark ? "text-white/30" : "text-gray-400"}`} />
          </div>
          <div className="text-center">
            <p className={`font-semibold ${textPrimary}`}>No children added yet</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>
              Add your child's profile so we can match them with the right program
            </p>
          </div>
          <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white gap-1">
            <Plus className="w-4 h-4" /> Add Your First Child
          </Button>
        </div>
      )}

      {/* Children grid */}
      {children && children.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child as ChildProfile}
              isDark={isDark}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {/* Add more button */}
          <button
            onClick={handleAdd}
            className={`rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-colors min-h-[200px] ${
              isDark
                ? "border-white/10 hover:border-white/20 text-white/30 hover:text-white/50"
                : "border-gray-200 hover:border-gray-300 text-gray-400 hover:text-gray-600"
            }`}
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Add Child</span>
          </button>
        </div>
      )}

      {/* Dialog */}
      <ChildFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditing(null); }}
        editing={editing}
        isDark={isDark}
      />
    </div>
  );
}

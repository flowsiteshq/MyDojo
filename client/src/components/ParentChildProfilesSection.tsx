import { trpc } from "@/lib/trpc";
import { Baby, User } from "lucide-react";

function getAge(dob: string | null | undefined): string {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

export function ParentChildProfilesSection() {
  const { data: profiles = [], isLoading } = trpc.childProfiles.adminList.useQuery({});

  if (isLoading) return null;
  if (profiles.length === 0) return null;

  return (
    <div className="mt-8 bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Baby className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-800">Parent-Submitted Child Profiles</h2>
        <span className="ml-2 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {profiles.length}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        These profiles were submitted by parents through the member portal. Review and convert them to full student records as needed.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            {profile.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow-sm" loading="lazy" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-200">
                <User className="h-8 w-8 text-purple-400" />
              </div>
            )}
            <div className="text-center">
              <p className="font-semibold text-gray-800 text-sm">{profile.name}</p>
              {profile.dateOfBirth && (
                <p className="text-xs text-gray-500">{getAge(profile.dateOfBirth)} old</p>
              )}
              {profile.program && (
                <span className="inline-block mt-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                  {profile.program}
                </span>
              )}
              {profile.notes && (
                <p className="text-xs text-gray-400 mt-1 italic line-clamp-2">"{profile.notes}"</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Added {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

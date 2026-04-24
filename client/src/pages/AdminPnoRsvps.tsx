import { AdminLayout } from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { PartyPopper, Phone, Users, UserPlus, StickyNote, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPnoRsvps() {
  const { data: rsvps, isLoading, refetch } = trpc.pno.getRsvps.useQuery();

  const totalKids = rsvps?.reduce((sum, r) => sum + (r.studentCount ?? 1), 0) ?? 0;
  const bringingFriend = rsvps?.filter((r) => r.bringingFriend).length ?? 0;

  return (
    <AdminLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-xl">
              <PartyPopper className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parents Night Out — Nerf Wars 🎯</h1>
              <p className="text-sm text-gray-500">Friday, April 25th · 6:00 PM – 9:00 PM · 11721 Spring Cypress Rd, Tomball TX</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{rsvps?.length ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">Families RSVPed</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-primary">{totalKids}</p>
            <p className="text-sm text-gray-500 mt-1">Kids Attending</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{bringingFriend}</p>
            <p className="text-sm text-gray-500 mt-1">Bringing a Friend</p>
          </div>
        </div>

        {/* RSVP List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : !rsvps || rsvps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <PartyPopper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No RSVPs yet</p>
            <p className="text-gray-400 text-sm mt-1">Share the link and check back soon!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rsvps.map((rsvp, i) => (
              <div
                key={rsvp.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                {/* Number badge */}
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{rsvp.parentName}</span>
                    {rsvp.bringingFriend && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        <UserPlus className="w-3 h-3" /> Bringing a Friend
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {rsvp.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {rsvp.studentCount} kid{rsvp.studentCount !== 1 ? "s" : ""}: {rsvp.studentNames}
                    </span>
                  </div>

                  {rsvp.friendName && (
                    <p className="text-sm text-green-700 mt-1">
                      Friend: <span className="font-medium">{rsvp.friendName}</span>
                    </p>
                  )}

                  {rsvp.notes && (
                    <p className="text-sm text-gray-500 mt-1 flex items-start gap-1">
                      <StickyNote className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                      {rsvp.notes}
                    </p>
                  )}
                </div>

                <div className="text-xs text-gray-400 shrink-0">
                  {rsvp.createdAt
                    ? new Date(rsvp.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

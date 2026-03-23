import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "@/components/AdminLayout";
import { Input } from "@/components/ui/input";
import { Users, Search, CheckCircle, Tag, Calendar, CreditCard, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminFamilyGroups() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: groups = [], isLoading } = trpc.family.adminListFamilyGroups.useQuery(
    search ? { search } : undefined,
    { refetchInterval: 30000 }
  );

  const totalFamilies = groups.length;
  const totalMembers = groups.reduce((acc, g) => acc + g.memberCount, 0);
  const totalRevenue = groups.filter(g => g.registrationFeePaid).length * 99;
  const discountedMembers = groups.reduce((acc, g) => acc + g.members.filter((m: any) => m.hasDiscount).length, 0);

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-red-100 p-3 rounded-xl">
            <Users className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Family Groups</h1>
            <p className="text-gray-500 text-sm">Manage family accounts and discount memberships</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Families", value: totalFamilies, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Total Members", value: totalMembers, icon: Users, color: "text-green-600", bg: "bg-green-50" },
            { label: "Discounted Members", value: discountedMembers, icon: Tag, color: "text-red-600", bg: "bg-red-50" },
            { label: "Registration Revenue", value: `$${totalRevenue}`, icon: CreditCard, color: "text-yellow-600", bg: "bg-yellow-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className={`${stat.bg} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-gray-400">Loading family groups...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No family groups found</p>
            <p className="text-gray-400 text-sm mt-1">Family accounts will appear here once created at <strong>/family-enrollment</strong></p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group: any) => (
              <div key={group.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === group.id ? null : group.id)}
                >
                  <div className="bg-red-100 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-red-600 font-black text-sm">
                      {group.primaryContactName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">{group.primaryContactName}</div>
                    <div className="text-sm text-gray-500 truncate">{group.primaryContactEmail}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm text-gray-500">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                    {group.registrationFeePaid ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> Paid
                      </span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Unpaid</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                    {expandedId === group.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === group.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contact Info */}
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Contact Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Name</span>
                            <span className="font-medium">{group.primaryContactName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email</span>
                            <span className="font-medium">{group.primaryContactEmail}</span>
                          </div>
                          {group.primaryContactPhone && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Phone</span>
                              <span className="font-medium">{group.primaryContactPhone}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Family ID</span>
                            <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded">#{group.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Payment Info */}
                      <div>
                        <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Registration Fee</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className={`font-medium ${group.registrationFeePaid ? 'text-green-600' : 'text-red-600'}`}>
                              {group.registrationFeePaid ? '✅ Paid' : '❌ Unpaid'}
                            </span>
                          </div>
                          {group.registrationFeeAmount && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Amount</span>
                              <span className="font-medium">${group.registrationFeeAmount}</span>
                            </div>
                          )}
                          {group.registrationFeePaidAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Paid On</span>
                              <span className="font-medium">{new Date(group.registrationFeePaidAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {group.registrationFeeTransactionId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Transaction ID</span>
                              <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded truncate max-w-[160px]">{group.registrationFeeTransactionId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Members */}
                    {group.members.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wider">Enrolled Members ({group.members.length})</h4>
                        <div className="space-y-2">
                          {group.members.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                  {member.memberOrder}
                                </span>
                                <span className="text-gray-700">Enrollment #{member.enrollmentId}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                {member.hasDiscount ? (
                                  <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                                    <Tag className="w-3 h-3" /> 50% Off
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Full Price</span>
                                )}
                                {member.originalMonthlyAmount && (
                                  <span className="text-gray-500 text-xs">
                                    {member.hasDiscount ? (
                                      <>
                                        <span className="line-through">${member.originalMonthlyAmount}</span>
                                        {" → "}
                                        <span className="text-red-600 font-bold">${member.discountedMonthlyAmount}/mo</span>
                                      </>
                                    ) : (
                                      <span>${member.originalMonthlyAmount}/mo</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

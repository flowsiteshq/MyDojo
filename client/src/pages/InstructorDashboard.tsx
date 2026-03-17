import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstructorFeedbackPanel } from "@/components/InstructorFeedbackPanel";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Award } from "lucide-react";

export default function InstructorDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Check if user is an instructor (admin role)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role !== 'admin') {
      window.location.href = '/';
    }
  }, [authLoading, isAuthenticated, user]);

  // Fetch all enrollments
  const { data: enrollments, isLoading: enrollmentsLoading } = trpc.member.getAllEnrollments.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === 'admin' }
  );

  if (authLoading || enrollmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-zinc-900 via-black to-zinc-900 text-white shadow-lg border-b-4 border-primary">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Award className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold font-heading">Instructor Dashboard</h1>
                <p className="text-sm text-gray-300">Manage student progress and feedback</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">Welcome, {user.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {!selectedEnrollmentId ? (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Select a Student</h2>
              <p className="text-muted-foreground">Choose a student to view their progress and add feedback</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment: any) => (
                  <Card
                    key={enrollment.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedEnrollmentId(enrollment.id);
                      setSelectedStudentName(enrollment.customerName);
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{enrollment.customerName}</h3>
                        <p className="text-sm text-muted-foreground">{enrollment.customerEmail}</p>
                        {enrollment.beltRank && (
                          <div className="mt-2">
                            <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                              {enrollment.beltRank}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 col-span-full">
                  <p className="text-muted-foreground text-center">No students found</p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedEnrollmentId(null);
                setSelectedStudentName("");
              }}
              className="mb-6"
            >
              ← Back to Students
            </Button>

            <InstructorFeedbackPanel
              enrollmentId={selectedEnrollmentId}
              studentName={selectedStudentName}
            />
          </div>
        )}
      </div>
    </div>
  );
}

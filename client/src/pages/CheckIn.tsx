import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Calendar, User, MapPin, QrCode } from "lucide-react";
import { toast } from "sonner";
import { QRScanner } from "@/components/QRScanner";

export default function CheckIn() {
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  // Get today's classes
  const { data: classes, isLoading, refetch } = trpc.attendance.getTodayClasses.useQuery();

  // Check-in mutation
  const checkInMutation = trpc.attendance.checkIn.useMutation({
    onSuccess: () => {
      toast.success("Checked In! You've successfully checked in for class.");
      refetch();
      setCheckingIn(null);
    },
    onError: (error) => {
      toast.error(`Check-In Failed: ${error.message}`);
      setCheckingIn(null);
    },
  });

  const handleCheckIn = (classScheduleId: number) => {
    setCheckingIn(classScheduleId);
    const today = new Date().toISOString().split('T')[0];
    checkInMutation.mutate({
      classScheduleId,
      attendanceDate: today,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4">Loading today's classes...</p>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[today.getDay()];
  const todayDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calendar className="h-10 w-10 text-red-600" />
            <h1 className="text-4xl font-bold text-white">Class Check-In</h1>
          </div>
          <p className="text-gray-400 text-lg">
            {todayName}, {todayDate}
          </p>
          <div className="mt-6">
            <Button
              onClick={() => setShowScanner(true)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-6 text-lg"
            >
              <QrCode className="h-6 w-6 mr-2" />
              Scan QR Code
            </Button>
          </div>
        </div>

        {/* QR Scanner Modal */}
        {showScanner && (
          <QRScanner
            onClose={() => setShowScanner(false)}
            onSuccess={() => refetch()}
          />
        )}

        {/* Classes List */}
        {!classes || classes.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700 p-8 text-center">
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Classes Today</h3>
            <p className="text-gray-400">
              There are no classes scheduled for today. Check back tomorrow!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {classes.map((classItem) => (
              <Card
                key={classItem.id}
                className={`bg-gray-800/50 border-gray-700 p-6 transition-all hover:bg-gray-800/70 ${
                  classItem.isCheckedIn ? 'border-green-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-red-600 p-2 rounded-lg">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{classItem.program}</h3>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                          <Clock className="h-4 w-4" />
                          <span>{classItem.startTime} - {classItem.endTime}</span>
                        </div>
                      </div>
                    </div>

                    {classItem.instructor && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                        <User className="h-4 w-4" />
                        <span>Instructor: {classItem.instructor}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{classItem.location}</span>
                    </div>
                  </div>

                  <div className="ml-4">
                    {classItem.isCheckedIn ? (
                      <div className="flex items-center gap-2 bg-green-600/20 text-green-400 px-4 py-2 rounded-lg border border-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-semibold">Checked In</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleCheckIn(classItem.id)}
                        disabled={checkingIn === classItem.id}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-6 text-lg"
                      >
                        {checkingIn === classItem.id ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Checking In...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Check In
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-gray-800/30 border-gray-700 p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">Check-In Information</h3>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <span>Check in when you arrive at the dojo before class starts</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <span>You can only check in once per class</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <span>Your attendance will be tracked for belt progression</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

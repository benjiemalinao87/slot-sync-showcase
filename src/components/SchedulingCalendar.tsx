
import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { getAvailableSlots, bookAppointment } from "@/utils/googleCalendarAuth";
import { TimeSlot } from "@/types/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const singleRep = {
  id: 1,
  name: "Sarah Johnson",
  image: "https://i.pravatar.cc/150?img=1",
  region: "West Coast",
  availability: "Mon-Fri, 9AM-5PM PST"
};

const BookingDialog = ({ isOpen, onClose, slot, onBook }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBook({
      name,
      email,
      notes,
      slot
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>
            Fill in your details to book this time slot
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Confirm Booking
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const SchedulingCalendar = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSlots = async () => {
    if (date) {
      setIsLoading(true);
      setError(null);
      try {
        const slots = await getAvailableSlots(date);
        setTimeSlots(slots);
      } catch (error: any) {
        console.error('Failed to fetch available slots:', error);
        setError(error.message || 'Failed to fetch available slots');
        toast({
          title: "Failed to fetch slots",
          description: error.message || "Please try again later",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (date) {
      fetchSlots();
    }
  }, [date]);

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.isAvailable) {
      toast({
        title: "Time slot unavailable",
        description: "Please select another time slot",
        variant: "destructive",
      });
      return;
    }

    setSelectedSlot(slot);
    setIsBookingOpen(true);
  };

  const handleBooking = async (bookingDetails: any) => {
    try {
      const startTime = `${date?.toISOString().split('T')[0]}T${bookingDetails.slot.startTime}:00`;
      const endTime = `${date?.toISOString().split('T')[0]}T${bookingDetails.slot.endTime}:00`;

      await bookAppointment(
        startTime,
        endTime,
        {
          name: bookingDetails.name,
          email: bookingDetails.email,
          notes: bookingDetails.notes
        }
      );

      toast({
        title: "Appointment Booked",
        description: `Your appointment has been scheduled with ${singleRep.name} for ${startTime}`,
      });

      fetchSlots();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-transparent p-6 rounded-t-lg">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-1">Book Your Appointment</CardTitle>
            <CardDescription className="text-gray-600">
              Select your preferred date and time
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center mb-8">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border-purple-100 shadow-md hover:shadow-lg transition-shadow"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Available Time Slots</h3>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {isLoading ? (
                <div className="col-span-full flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : timeSlots.length > 0 ? timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={slot.isAvailable ? "outline" : "ghost"}
                  className={`w-full ${
                    slot.isAvailable
                      ? "border-purple-200 hover:bg-purple-50 hover:border-purple-300 text-gray-700"
                      : "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => handleTimeSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                >
                  {slot.startTime}
                </Button>
              )) : (
                <p className="text-gray-500 col-span-full text-center py-4">
                  Select a date to view available slots
                </p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-500">
            Need help? Contact us at support@example.com
          </p>
        </CardFooter>
      </Card>
      <BookingDialog
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        slot={selectedSlot}
        onBook={handleBooking}
      />
    </div>
  );
};

export default SchedulingCalendar;


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
import { format } from "date-fns";
import { CalendarClock, Loader } from "lucide-react";

const singleRep = {
  id: 1,
  name: "Sarah Johnson",
  image: "https://i.pravatar.cc/150?img=1",
  region: "West Coast",
  availability: "Mon-Fri, 9AM-5PM PST"
};

const BookingDialog = ({
  isOpen,
  onClose,
  slot,
  onBook
}: any) => {
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
  return <Dialog open={isOpen} onOpenChange={onClose}>
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
            <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <Button type="submit" className="w-full">
            Confirm Booking
          </Button>
        </form>
      </DialogContent>
    </Dialog>;
};

const LoadingState = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-12 space-y-4">
    <div className="relative">
      <Loader className="w-8 h-8 animate-spin text-purple-500" />
      <div className="absolute inset-0 w-8 h-8 border-4 border-purple-100 rounded-full"></div>
    </div>
    <p className="text-gray-600 animate-pulse">Getting available slots...</p>
  </div>
);

const NoSlotsState = () => (
  <div className="col-span-full text-center py-8 space-y-4">
    <CalendarClock className="w-12 h-12 mx-auto text-gray-400" />
    <p className="text-gray-500">Select a date to view available slots</p>
  </div>
);

const SchedulingCalendar = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    toast
  } = useToast();

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
          variant: "destructive"
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
        variant: "destructive"
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
      await bookAppointment(startTime, endTime, {
        name: bookingDetails.name,
        email: bookingDetails.email,
        notes: bookingDetails.notes
      });
      toast({
        title: "Appointment Booked",
        description: `Your appointment has been scheduled with ${singleRep.name} for ${startTime}`
      });
      fetchSlots();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the appointment. Please try again.",
        variant: "destructive"
      });
    }
  };

  return <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="border border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-transparent p-6 rounded-t-lg">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800 mb-1">Book Your Appointment</CardTitle>
            <CardDescription className="text-gray-600">
              Select your preferred date and time with {singleRep.name}
            </CardDescription>
          </div>
          {date && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Selected Date</p>
              <p className="text-lg font-semibold text-purple-600">{format(date, "MMMM d, yyyy")}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:space-x-8 space-y-8 md:space-y-0">
            <div className="md:w-1/2">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">1. Choose a Date</h3>
              <Calendar 
                mode="single" 
                selected={date} 
                onSelect={setDate} 
                className="rounded-lg border-purple-100 shadow-md hover:shadow-lg transition-shadow bg-white"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </div>
            <div className="md:w-1/2">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">2. Select Available Time</h3>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-2 gap-3">
                {isLoading ? (
                  <LoadingState />
                ) : timeSlots.length > 0 ? (
                  timeSlots.map(slot => (
                    <Button 
                      key={slot.id} 
                      variant={slot.isAvailable ? "outline" : "ghost"} 
                      className={`
                        w-full py-6 relative
                        ${slot.isAvailable 
                          ? "border-purple-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-md transition-all duration-200 text-gray-700" 
                          : "opacity-50 cursor-not-allowed bg-gray-50"
                        }
                      `}
                      onClick={() => handleTimeSlotSelect(slot)} 
                      disabled={!slot.isAvailable}
                    >
                      <span className="font-medium">{slot.startTime}</span>
                      {slot.isAvailable ? (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-green-600">
                          Available
                        </span>
                      ) : (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-500">
                          Unavailable
                        </span>
                      )}
                    </Button>
                  ))
                ) : (
                  <NoSlotsState />
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-6 py-4 bg-gray-50 rounded-b-lg">
          <p className="text-sm text-gray-500">
            Appointments are in {singleRep.region} ({singleRep.availability})
          </p>
        </CardFooter>
      </Card>
      <BookingDialog isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} slot={selectedSlot} onBook={handleBooking} />
    </div>;
};

export default SchedulingCalendar;

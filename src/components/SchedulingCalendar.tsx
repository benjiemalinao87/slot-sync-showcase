import React, { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarClock, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAvailableSlots, bookAppointment, initializeGoogleAuth } from "@/utils/googleCalendarAuth";
import { TimeSlot } from "@/types/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const salesReps = [
  {
    id: 1,
    name: "Sarah Johnson",
    image: "https://i.pravatar.cc/150?img=1",
    region: "West Coast",
    availability: "Mon-Fri, 9AM-5PM PST"
  },
  {
    id: 2,
    name: "Michael Chen",
    image: "https://i.pravatar.cc/150?img=2",
    region: "East Coast",
    availability: "Mon-Fri, 10AM-6PM EST"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    image: "https://i.pravatar.cc/150?img=3",
    region: "Central",
    availability: "Mon-Fri, 9AM-5PM CST"
  }
];

const BookingDialog = ({ isOpen, onClose, slot, onBook, selectedRep }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onBook({
      name,
      email,
      notes,
      slot,
      rep: selectedRep
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
  const [selectedRep, setSelectedRep] = React.useState<number | null>(null);
  const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = React.useState<TimeSlot | null>(null);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchSlots = async () => {
      if (date && selectedRep) {
        try {
          const slots = await getAvailableSlots('primary', date);
          setTimeSlots(slots);
        } catch (error) {
          toast({
            title: "Failed to fetch slots",
            description: "Please try again later",
            variant: "destructive",
          });
        }
      }
    };

    fetchSlots();
  }, [date, selectedRep, toast]);

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
      const rep = salesReps.find(r => r.id === selectedRep);
      const startTime = `${date?.toISOString().split('T')[0]}T${bookingDetails.slot.startTime}:00`;
      const endTime = `${date?.toISOString().split('T')[0]}T${bookingDetails.slot.endTime}:00`;
      
      await bookAppointment(
        'primary',
        startTime,
        endTime,
        `Meeting with ${rep?.name}`,
        `Booking details:\nName: ${bookingDetails.name}\nEmail: ${bookingDetails.email}\nNotes: ${bookingDetails.notes}`
      );

      toast({
        title: "Appointment Booked",
        description: `Your appointment has been scheduled for ${startTime}`,
      });

      // Refresh the time slots
      const newSlots = await getAvailableSlots('primary', date!);
      setTimeSlots(newSlots);
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: "Failed to book the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnectCalendar = () => {
    initializeGoogleAuth();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-gray-800">Company Availability</CardTitle>
                <CardDescription className="text-gray-600">
                  Select a date to view available time slots
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleConnectCalendar}
              >
                <CalendarIcon className="h-4 w-4" />
                Connect Calendar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-4">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border shadow pointer-events-auto"
                />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Available Time Slots</h3>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant="outline"
                      className={`${
                        slot.isAvailable
                          ? "hover:bg-purple-50 hover:border-purple-200"
                          : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => handleTimeSlotSelect(slot)}
                      disabled={!slot.isAvailable}
                    >
                      {slot.startTime}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-1/3">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">Sales Representatives</CardTitle>
              <CardDescription className="text-gray-600">
                Choose your preferred representative
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {salesReps.map((rep) => (
                    <Card
                      key={rep.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedRep === rep.id ? 'ring-2 ring-purple-400' : ''
                      }`}
                      onClick={() => setSelectedRep(rep.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-12 w-12">
                          <img src={rep.image} alt={rep.name} className="object-cover" />
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{rep.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span>{rep.region}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <CalendarClock className="h-4 w-4" />
                            <span>{rep.availability}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <BookingDialog
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        slot={selectedSlot}
        selectedRep={selectedRep}
        onBook={handleBooking}
      />
    </div>
  );
};

export default SchedulingCalendar;

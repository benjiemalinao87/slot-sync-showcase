import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarClock, MapPin, CalendarPlus, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAvailableSlots, bookAppointment, getGoogleAuthUrl } from "@/utils/googleCalendarAuth";
import { TimeSlot } from "@/types/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSlots = async () => {
    if (date && selectedRep) {
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
    if (date && selectedRep) {
      fetchSlots();
    }
  }, [date, selectedRep]);

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
        description: `Your appointment has been scheduled with ${rep?.name} for ${startTime}`,
      });

      // Refresh the time slots
      fetchSlots();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to book the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAuthSetup = () => {
    const authUrl = getGoogleAuthUrl();
    window.open(authUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
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
                {selectedRep ? (
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
                        Select a date and sales representative to view available slots
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Please select a sales representative to view available slots
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="px-6 py-4 bg-gray-50 rounded-b-lg">
              <p className="text-sm text-gray-500">
                Need help? Contact us at support@example.com
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:w-1/3">
          <Card className="border border-purple-100 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-800 mb-1">Sales Representatives</CardTitle>
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
                        selectedRep === rep.id 
                          ? 'ring-2 ring-purple-400 bg-purple-50' 
                          : 'hover:border-purple-200'
                      }`}
                      onClick={() => setSelectedRep(rep.id)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-12 w-12 ring-2 ring-purple-100">
                          <img src={rep.image} alt={rep.name} className="object-cover" />
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{rep.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4 text-purple-400" />
                            <span>{rep.region}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <CalendarClock className="h-4 w-4 text-purple-400" />
                            <span>{rep.availability}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="px-6 py-4 bg-gray-50 flex justify-center">
            </CardFooter>
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

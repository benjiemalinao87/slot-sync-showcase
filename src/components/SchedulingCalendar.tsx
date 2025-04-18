
import React from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarClock, MapPin, Users } from "lucide-react";

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

const SchedulingCalendar = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [selectedRep, setSelectedRep] = React.useState<number | null>(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-2/3">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-gray-800">Company Availability</CardTitle>
              <CardDescription className="text-gray-600">
                Select a date to view available time slots
              </CardDescription>
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
                  {["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"].map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      className="hover:bg-purple-50 hover:border-purple-200"
                    >
                      {time}
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
    </div>
  );
};

export default SchedulingCalendar;

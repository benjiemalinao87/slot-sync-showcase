
import SchedulingCalendar from "@/components/SchedulingCalendar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900">Schedule a Meeting</h1>
          <p className="text-gray-600 mt-2">Choose your preferred time slot with our sales team</p>
        </div>
      </header>
      <main>
        <SchedulingCalendar />
      </main>
    </div>
  );
};

export default Index;

import { TempEventCalendar } from "./temp-event-calendar";

export default function UpcomingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Upcoming Page</h1>
      <p className="mt-4 text-lg text-gray-600">
        This is the upcoming page of the application.
        Where you can view your upcoming tasks and deadlines.
      </p>

      <TempEventCalendar />
    </div>
  );
}
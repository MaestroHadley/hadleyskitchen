import { notFound } from "next/navigation";
import { EventPlanner } from "@/components/event-planner";
import { getEvent } from "@/lib/planner-data";

export default async function EventPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getEvent(id);
  if (!data) notFound();
  return <EventPlanner initialEvent={data.event} recipes={data.recipes} settings={data.settings} />;
}

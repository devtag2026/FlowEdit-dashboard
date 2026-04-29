import { Megaphone } from "lucide-react";

const EmptyBroadcastDetail = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full min-h-125">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Megaphone className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-bold text-accent mb-2">Select a Broadcast</h3>
      <p className="text-accent/60 max-w-md">
        Choose a broadcast from the list to view its details, or create a new
        broadcast to communicate with your team.
      </p>
    </div>
  );
};

export default EmptyBroadcastDetail;

"use client";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen } from "lucide-react";

export default function Resources() {
  return (
    <main className="min-h-screen bg-secondary px-4 py-5 pb-4">
      <Card className="bg-tertiary rounded-xl md:rounded-3xl">
        <CardContent className="flex flex-col items-center text-center py-16 gap-4">
          <div className="w-12 h-12 rounded-full bg-accent/5 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-accent/30" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-accent">Nothing here yet</h2>
            <p className="text-accent/50 text-sm mt-1">Resources will be added here by the admin.</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// File: src/components/booking/TimeGridPicker.jsx

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button is in this path

/* ============ Helpers (Moved here for encapsulation) ============ */
const pad2 = (n) => String(n).padStart(2, "0");

function generateTimeOptions(start = "08:00", end = "18:00", stepMin = 30) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const arr = [];
  for (let t = startMin; t <= endMin; t += stepMin) {
    arr.push(`${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`);
  }
  return arr;
}

function isOverlapping(startA, endA, startB, endB) {
  // Function to check if two time ranges overlap (uses milliseconds)
  return Math.max(startA, startB) < Math.min(endA, endB);
}

function slotsOfDayForPost(allSlots, postId, ymd) {
  // Function to filter slots for a specific post and day
  if (!postId || !ymd) return [];
  const startOfDay = new Date(`${ymd}T00:00:00`).getTime();
  const endOfDay = new Date(`${ymd}T23:59:59`).getTime();
  return (allSlots || []).filter((s) => {
    if (String(s.postId) !== String(postId)) return false;
    // Use optional chaining and default values for safety
    const st = new Date(s?.startTime || s?.start || 0).getTime();
    return st >= startOfDay && st <= endOfDay;
  });
}
/* ============ End Helpers ============ */


/* ============ TimeGridPicker Component ============ */
function TimeGridPicker({ selectedDate, postId, duration, allSlots, onPick }) {
  // If no date or post is selected, show placeholder text
  if (!selectedDate || !postId) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-md bg-muted/50">
        กรุณาเลือก “ประกาศ” และ “วันนัด” ก่อน
      </div>
    );
  }

  // Generate time options (e.g., 08:00, 08:30, ...)
  const timeOptions = useMemo(() => generateTimeOptions("08:00", "18:00", 30), []);

  // Get existing slots for the selected post and date, converted to milliseconds
  const existingSlotsMs = useMemo(() => {
    // Ensure allSlots is always an array before calling filter/map
    const slotsToProcess = Array.isArray(allSlots) ? allSlots : [];
    return slotsOfDayForPost(slotsToProcess, postId, selectedDate).map((s) => ({
      // Use optional chaining and default values for safety
      startMs: new Date(s?.startTime || s?.start || 0).getTime(),
      endMs: new Date(s?.endTime || s?.end || 0).getTime(),
    }));
  }, [allSlots, postId, selectedDate]);


  // Function to check if a potential new slot is available
  function isAvailable(timeStr) {
    const [hh, mm] = timeStr.split(":").map(Number);
    const potentialStartMs = new Date(`${selectedDate}T${timeStr}:00`).getTime();
    const endMins = hh * 60 + mm + duration;
    const endHH = pad2(Math.floor(endMins / 60));
    const endMM = pad2(endMins % 60);
    const potentialEndMs = new Date(`${selectedDate}T${endHH}:${endMM}:00`).getTime();

    // Check 1: Ensure end time does not exceed 18:00
    const maxEndMs = new Date(`${selectedDate}T18:00:00`).getTime();
    // Allow ending exactly at 18:00
    if (potentialEndMs > maxEndMs) {
        return false;
    }

    // Check 2: Ensure it doesn't overlap with existing slots
    for (const existing of existingSlotsMs) {
      // Make sure existing slot has valid times before checking overlap
      if (existing.startMs && existing.endMs && isOverlapping(potentialStartMs, potentialEndMs, existing.startMs, existing.endMs)) {
        return false; // Overlaps with an existing slot
      }
    }

    // Check 3: Ensure start time is in the future (compared to current time if date is today)
    // Get current time adjusted to beginning of the current minute for comparison
    const now = new Date();
    const nowMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()).getTime();
     // Only check past time if the selected date IS today
     const selectedDateStartMs = new Date(`${selectedDate}T00:00:00`).getTime();
     const todayStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
     if (selectedDateStartMs === todayStartMs && potentialStartMs < nowMs) {
         return false; // Cannot schedule in the past minute or earlier on the current day
     }

    return true; // Slot is available
  }

  // Render the grid of time buttons
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {timeOptions.map((time) => {
        const available = isAvailable(time);
        return (
          <Button
            key={time}
            variant={available ? "outline" : "secondary"} // Style available vs unavailable
            size="sm" // Make buttons slightly smaller
            className="justify-center text-xs h-8" // Adjust text size and height
            disabled={!available} // Disable unavailable slots
            onClick={() => available && onPick(time)} // Call onPick when an available slot is clicked
          >
            {time}
          </Button>
        );
      })}
    </div>
  );
}

export default TimeGridPicker; // Export the component
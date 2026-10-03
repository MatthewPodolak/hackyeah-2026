"use client"
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function Home() {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {isClicked ? (
        <Spinner size="lg" />
      ):(
        <Button onClick={() => setIsClicked(true)} size="lg">{"CLICK ME <3"}</Button>
      )}
    </div>
  );
}

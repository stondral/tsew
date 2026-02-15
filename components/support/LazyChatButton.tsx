"use client";

import dynamic from "next/dynamic";

const ChatButton = dynamic(
  () => import("@/components/support/ChatButton").then((mod) => ({ default: mod.ChatButton })),
  { ssr: false, loading: () => null }
);

export default function LazyChatButton() {
  return <ChatButton />;
}

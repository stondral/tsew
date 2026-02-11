"use client";

import { useState } from "react";
import { HelpCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface HelpButtonProps {
  orderId: string;
  orderNumber: string;
}

export function HelpButton({ orderId, orderNumber }: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      alert("Please fill in both subject and message");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("payload-token");
      
      const response = await fetch("/api/support/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject,
          message,
          orderId,
          orderNumber,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        setSubject("");
        setMessage("");
        setTimeout(() => {
          setIsOpen(false);
          setIsSuccess(false);
        }, 2000);
      } else {
        alert("Failed to create support ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Error creating support ticket");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-14 font-bold transition-all"
      >
        <HelpCircle className="w-5 h-5 mr-2" />
        Get Help with Order
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6 space-y-6">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ticket Created!</h3>
                <p className="text-sm text-gray-600">
                  We've created a support ticket for your order. Our team will respond shortly.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Get Help</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Order Reference</p>
                  <Badge variant="outline" className="w-full justify-center py-2 text-base">
                    #{orderNumber}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <Input
                    placeholder="e.g., Product arrived damaged"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="rounded-xl border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    placeholder="Describe your issue in detail..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={isLoading}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isLoading ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { submitFeedback } from "@/lib/payload/feedback"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { CheckCircle2, ChevronRight, ChevronLeft, Send, Check } from "lucide-react"

const buyerSteps = [
  { id: "info", title: "Let's get started", description: "First, we'd love to know who you are." },
  // { id: "role", title: "Your Role", description: "Are you a Seller or Buyer?" },
  { id: "visual", title: "Visual Appeal", description: "Question 1 of 4" },
  { id: "greenFlag", title: "Trust Signals", description: "Question 2 of 4" },
  // { id: "discovery", title: "Brand Discovery", description: "Question 2 of 5" },
  { id: "interest", title: "Platform Interest", description: "Question 3 of 4" },
  { id: "categories", title: "Product Categories", description: "Question 4 of 4" },
  { id: "improvement", title: "Future Improvements", description: "Final Step" },
]

/*
const sellerSteps = [
  { id: "info", title: "Let's get started", description: "First, we'd love to know who you are." },
  { id: "role", title: "Your Role", description: "Are you a Seller or Buyer?" },
  { id: "model", title: "Our Model", description: "How Stond Emporium Works" },
  { id: "problems", title: "Unique Value", description: "Question 1 of 3" },
  { id: "sellerui", title: "Seller Dashboard", description: "Question 2 of 3" },
  { id: "join", title: "Join Us", description: "Question 3 of 3" },
]
*/

export default function FeedbackPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    userRole: "buyer" as "buyer" | "seller",
    visualAppeal: 0,
    discoverySource: "",
    greenFlag: "",
    platformInterest: "",
    categories: [] as string[],
    otherCategory: "",
    problemsSolved: "",
    sellerUiFeedback: "",
    wantsToJoin: "",
    improvements: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = buyerSteps // Defaulting to buyer only for now

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ""))

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    
    // Simplified submission - categories.includes("other") handled by otherCategory field
    const result = await submitFeedback({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      userRole: formData.userRole as 'buyer' | 'seller',
      visualAppeal: formData.visualAppeal || undefined,
      discoverySource: formData.discoverySource || undefined,
      greenFlag: formData.greenFlag || undefined,
      platformInterest: formData.platformInterest || undefined,
      categories: formData.categories.length > 0 ? formData.categories : undefined,
      otherCategory: formData.otherCategory || undefined,
      problemsSolved: formData.problemsSolved || undefined,
      sellerUiFeedback: formData.sellerUiFeedback || undefined,
      wantsToJoin: formData.wantsToJoin || undefined,
      improvements: formData.improvements,
    })
    
    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || "An error occurred")
    }
    setIsSubmitting(false)
  }

  const updateField = (field: keyof typeof formData, value: string | number | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(cat)
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) }
      } else {
        return { ...prev, categories: [...prev.categories, cat] }
      }
    })
  }

  const renderCurrentStep = () => {
    const stepId = steps[currentStep]?.id
    
    switch (stepId) {
      case "info": // INFO
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white text-lg">What is your name?</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-lg">And your email address?</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 focus:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white text-lg">Finally, what&apos;s your phone number?</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 focus:ring-orange-500"
                />
              </div>
            </div>
            <Button 
              onClick={handleNext} 
              disabled={!formData.name || !isValidEmail(formData.email) || !isValidPhone(formData.phone)}
              className="w-full bg-orange-500 hover:bg-orange-600 h-12 text-lg"
            >
              Start Survey <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )
/*
      case "role": // ROLE SELECTION
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Label className="text-white text-lg block text-center leading-relaxed">
              Are you a Seller or a Buyer?
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => updateField("userRole", "buyer")}
                className={`p-8 rounded-2xl text-center transition-all border ${
                  formData.userRole === "buyer"
                  ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white/20 border-white/30 text-white/90 hover:bg-white/30"
                }`}
              >
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="font-bold text-xl mb-2">Buyer</h3>
                <p className="text-sm opacity-70">I want to shop for products</p>
              </button>
              <button
                onClick={() => updateField("userRole", "seller")}
                className={`p-8 rounded-2xl text-center transition-all border ${
                  formData.userRole === "seller"
                  ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white/20 border-white/30 text-white/90 hover:bg-white/30"
                }`}
              >
                <div className="text-4xl mb-3">🏪</div>
                <h3 className="font-bold text-xl mb-2">Seller</h3>
                <p className="text-sm opacity-70">I want to sell my products</p>
              </button>
            </div>
            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!formData.userRole}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )
*/
      case "visual": // VISUAL APPEAL (Buyer)
      case "model": // MODEL INFO (Seller - currently unused)
        if (formData.userRole === "seller") {
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-white">How Stond Emporium Works</h2>
                <div className="space-y-6 text-left">
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold text-white">1</div>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-2">Zero Commission Model</h3>
                        <p className="text-white/60 text-sm leading-relaxed">Unlike other platforms that charge 15-30% commission, we charge a flat monthly subscription. Keep 100% of your profits.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold text-white">2</div>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-2">Dedicated Seller Dashboard + Whatsapp Integration</h3>
                        <p className="text-white/60 text-sm leading-relaxed">Manage inventory, track analytics, process orders,Your business one chat away</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 bg-orange-500 rounded-full flex items-center justify-center shrink-0 font-bold text-white">3</div>
                      <div>
                        <h3 className="text-white font-bold text-lg mb-2">India-First Platform</h3>
                        <p className="text-white/60 text-sm leading-relaxed">Built specifically for Indian sellers and buyers. Local payment methods, logistics partners, and customer support that understands your market.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
                >
                  Got it! <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )
        }
        // BUYER: VISUAL APPEAL
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <Label className="text-white text-lg block text-center leading-relaxed">
                On a scale of 1 to 10, how would you rate the visual appeal and ease of navigation on our homepage?
              </Label>
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => updateField("visualAppeal", num)}
                    className={`h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                      formData.visualAppeal === num 
                      ? "bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/50" 
                      : "bg-white/10 text-white/40 hover:bg-white/20"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-white/40 text-sm px-1">
                <span className="max-w-[100px] text-left">1 = Very Poor / Confusing</span>
                <span className="max-w-[100px] text-right">10 = Excellent / Very Intuitive</span>
              </div>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={formData.visualAppeal === 0}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                Next Question <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case "greenFlag": // GREEN FLAG (Buyer)
        const greenFlagOptions = [
          { 
            emoji: "🚀", 
            label: "A smooth 'Guest Checkout' where I don&apos;t have to create an account", 
            value: "guest_checkout" 
          },
          { 
            emoji: "✨", 
            label: "A clean, distraction-free store that lets me focus on the product", 
            value: "clean_store" 
          },
          { 
            emoji: "💳", 
            label: "Recognized and seamless payment links (like UPI or WhatsApp Pay) that feel secure", 
            value: "secure_payments" 
          },
          { 
            emoji: "💬", 
            label: "Seeing a real 'About Us' story or an instant way to chat with a human", 
            value: "human_connection" 
          },
        ]
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-3">
              <Label className="text-white text-xl block leading-relaxed font-semibold">
                When you discover a new brand, what is the #1 &apos;Green Flag&apos; that gives you the confidence to place an order instantly?
              </Label>
              <p className="text-white/50 text-sm italic">
                Choose the option that matters most to you
              </p>
            </div>
            <div className="space-y-3">
              {greenFlagOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField("greenFlag", opt.value)}
                  className={`w-full p-5 rounded-2xl text-left transition-all border flex items-start gap-4 ${
                    formData.greenFlag === opt.value
                    ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <span className="text-3xl shrink-0">{opt.emoji}</span>
                  <span className="font-medium text-base leading-relaxed">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!formData.greenFlag}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                Next Question <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case "discovery": // DISCOVERY (Buyer - currently unused)
      case "problems": // PROBLEMS SOLVED (Seller - currently unused)
        if (formData.userRole === "seller") {
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label htmlFor="problemsSolved" className="text-white text-lg block text-center leading-relaxed">
                  What problems can Stond Emporium solve for you that other platforms don&apos;t?
                </Label>
                <Textarea
                  id="problemsSolved"
                  placeholder="Tell us about your challenges with current platforms..."
                  value={formData.problemsSolved}
                  onChange={(e) => updateField("problemsSolved", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px] focus:ring-orange-500 text-base"
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!formData.problemsSolved}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )
        }
        // BUYER: DISCOVERY
        const discoveryOptions = [
          { label: "Email Newsletter", value: "email" },
          { label: "Direct Contact (Founders)", value: "direct" },
          { label: "WhatsApp", value: "whatsapp" },
          { label: "LinkedIn", value: "linkedin" },
          { label: "Social Media", value: "social" },
          { label: "Other", value: "other" },
        ]
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Label className="text-white text-lg block text-center">
              How did you first discover our brand?
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {discoveryOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField("discoverySource", opt.value)}
                  className={`p-4 rounded-xl text-left transition-all border ${
                    formData.discoverySource === opt.value
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!formData.discoverySource}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case "interest": // INTEREST (Buyer)
      case "sellerui": // SELLER UI FEEDBACK (Seller - currently unused)
        if (formData.userRole === "seller") {
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <Label htmlFor="sellerUiFeedback" className="text-white text-lg block text-center leading-relaxed">
                  What are your thoughts on our seller dashboard and interface?
                </Label>
                <Textarea
                  id="sellerUiFeedback"
                  placeholder="Share your feedback on the seller experience..."
                  value={formData.sellerUiFeedback}
                  onChange={(e) => updateField("sellerUiFeedback", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px] focus:ring-orange-500 text-base"
                />
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!formData.sellerUiFeedback}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
                >
                  Almost Done <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )
        }
        // BUYER: INTEREST
        const interestOptions = [
          { label: "Very Interested", value: "very" },
          { label: "Somewhat Interested", value: "somewhat" },
          { label: "Neutral", value: "neutral" },
          { label: "Not Interested", value: "none" },
        ]
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <Label className="text-white text-lg block leading-relaxed">
                How interested are you in a platform that is a marketplace exclusively for Indian sellers and startups?
              </Label>
              <p className="text-white/40 text-sm italic">Local empowerment, global standards.</p>
            </div>
            <div className="space-y-3">
              {interestOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateField("platformInterest", opt.value)}
                  className={`w-full p-5 rounded-2xl text-center font-medium transition-all border ${
                    formData.platformInterest === opt.value
                    ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!formData.platformInterest}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                Almost there <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case "categories": // CATEGORIES (Buyer)
      case "join": // JOIN INTEREST (Seller - currently unused)
        if (formData.userRole === "seller") {
          const joinOptions = [
            { label: "Yes, I am ready to join!", value: "yes" },
            { label: "Maybe later", value: "maybe" },
            { label: "No, not interested", value: "no" },
          ]
          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <Label className="text-white text-lg block leading-relaxed">
                  Would you like to join Stond Emporium as a seller?
                </Label>
                <p className="text-white/40 text-sm italic">Start selling with zero commission fees</p>
              </div>
              <div className="space-y-3">
                {joinOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("wantsToJoin", opt.value)}
                    className={`w-full p-5 rounded-2xl text-center font-medium transition-all border ${
                      formData.wantsToJoin === opt.value
                      ? "bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20"
                      : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-4 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={handleBack} 
                  className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={!formData.wantsToJoin || isSubmitting}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
                >
                  {isSubmitting ? "Submitting..." : "Complete Submission"} <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )
        }
        // BUYER: CATEGORIES
        const categories = [
          { label: "Fashion & Apparel", value: "fashion" },
          { label: "Electronics & Accessories", value: "electronics" },
          { label: "Home & Decor", value: "home" },
          { label: "Beauty & Personal Care", value: "beauty" },
          { label: "Artisanal/Handmade", value: "artisanal" },
          { label: "Other", value: "other" },
        ]
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Label className="text-white text-lg block">
                Which product categories are you most likely to shop for?
              </Label>
              <p className="text-white/40 text-sm mt-1">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => toggleCategory(cat.value)}
                  className={`p-4 rounded-xl flex items-center justify-between transition-all border ${
                    formData.categories.includes(cat.value)
                    ? "bg-orange-500/20 border-orange-500 text-white"
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60"
                  }`}
                >
                  <span className="text-sm font-medium">{cat.label}</span>
                  {formData.categories.includes(cat.value) && <Check className="h-4 w-4 text-orange-500" />}
                </button>
              ))}
            </div>

            {formData.categories.includes("other") && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4"
              >
                <Label htmlFor="otherCategory" className="text-white/60 text-sm mb-2 block">Please specify:</Label>
                <Input
                  id="otherCategory"
                  placeholder="Tell us what you're looking for..."
                  value={formData.otherCategory}
                  onChange={(e) => updateField("otherCategory", e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-10 focus:ring-orange-500"
                />
              </motion.div>
            )}

            <div className="flex gap-4 pt-2">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={formData.categories.length === 0}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                Final Step <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )

      case "improvement": // IMPROVEMENTS (Buyer only)
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Label htmlFor="improvements" className="text-white text-lg block text-center leading-relaxed">
                What is one specific feature or improvement that would make your experience with us better than other e-commerce platforms?
              </Label>
              <Textarea
                id="improvements"
                placeholder="Share your thoughts with us..."
                value={formData.improvements}
                onChange={(e) => updateField("improvements", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[150px] focus:ring-orange-500 text-base"
              />
            </div>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                onClick={handleBack} 
                className="flex-1 border border-white/20 text-white hover:bg-white/10 h-12"
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!formData.improvements || isSubmitting}
                className="flex-[2] bg-orange-500 hover:bg-orange-600 h-12"
              >
                {isSubmitting ? "Submitting..." : "Complete Submission"} <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )
    }
  }

  if (isSuccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden"
        style={{ backgroundImage: "url('/slide-screenshot.png')" }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <Card className="w-full max-w-lg bg-white/10 backdrop-blur-xl border-white/20 p-12 text-center relative z-10 shadow-2xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="h-10 w-10 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">You&apos;re Awesome!</h2>
          <p className="text-white/70 text-lg mb-8">
            Thank you for helping us shape the future of Stond Emporium. Your insights are incredibly valuable.
          </p>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 px-8"
            onClick={() => window.location.href = "/"}
          >
            Go back to Homepage
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div 
      className="min-h-[100vh] -mt-[80px] pt-[140px] flex items-start justify-center p-4 bg-cover bg-center bg-no-repeat relative overflow-hidden font-outfit"
      style={{ backgroundImage: "url('/slide-screenshot.png')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Decorative gradients */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-[100px]" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />

      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-xl border-white/20 p-8 md:p-12 relative z-10 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                idx <= currentStep ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{steps[currentStep].title}</h1>
          <p className="text-white/40 font-medium">{steps[currentStep].description}</p>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && (
          <p className="text-red-400 text-center mt-6 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>
        )}

        <div className="mt-12 text-center">
          <p className="text-white/20 text-xs font-medium tracking-widest uppercase">
            Built by Stond Labs &bull; © 2026
          </p>
        </div>
      </Card>
    </div>
  )
}

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

const steps = [
  { id: "info", title: "Let's get started", description: "First, we'd love to know who you are." },
  { id: "visual", title: "Visual Appeal", description: "Question 1 of 5" },
  { id: "discovery", title: "Brand Discovery", description: "Question 2 of 5" },
  { id: "interest", title: "Platform Interest", description: "Question 3 of 5" },
  { id: "categories", title: "Product Categories", description: "Question 4 of 5" },
  { id: "improvement", title: "Future Improvements", description: "Question 5 of 5" },
]

export default function FeedbackPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    visualAppeal: 0,
    discoverySource: "",
    platformInterest: "",
    categories: [] as string[],
    otherCategory: "",
    improvements: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    
    // Merge 'other' category if provided
    const finalCategories = [...formData.categories]
    if (formData.categories.includes("other") && formData.otherCategory) {
      // Remove 'other' marker and add specific value
      const index = finalCategories.indexOf("other")
      if (index > -1) finalCategories.splice(index, 1)
      finalCategories.push(`Other: ${formData.otherCategory}`)
    }

    const result = await submitFeedback({
      ...formData,
      categories: finalCategories
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
    switch (currentStep) {
      case 0: // INFO
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

      case 1: // VISUAL APPEAL
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

      case 2: // DISCOVERY
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

      case 3: // INTEREST
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
                How interested are you in a platform that is a marketplace exclusively for Indian sellers and sellers?
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

      case 4: // CATEGORIES
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

      case 5: // IMPROVEMENTS
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

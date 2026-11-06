import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Send, ArrowLeft, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const RatingInput = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
}) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          <Star
            className={`h-8 w-8 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

const Feedback = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    overallExperience: 0,
    toolUsefulness: 0,
    perceivedValue: 0,
    easeOfUse: 0,
    mostUsefulFeature: "",
    improvementSuggestions: "",
    wouldRecommend: null as boolean | null,
    additionalComments: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRatingChange = (field: string, value: number) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your name and email.",
        variant: "destructive",
      });
      return;
    }

    if (formData.overallExperience === 0 || formData.toolUsefulness === 0 || 
        formData.perceivedValue === 0 || formData.easeOfUse === 0) {
      toast({
        title: "Ratings required",
        description: "Please provide all 4 ratings.",
        variant: "destructive",
      });
      return;
    }

    if (formData.wouldRecommend === null) {
      toast({
        title: "Recommendation required",
        description: "Please indicate if you would recommend SCRF.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("feedback").insert({
        user_id: user?.id || null,
        name: formData.name.trim(),
        email: formData.email.trim(),
        overall_experience: formData.overallExperience,
        tool_usefulness: formData.toolUsefulness,
        perceived_value: formData.perceivedValue,
        ease_of_use: formData.easeOfUse,
        most_useful_feature: formData.mostUsefulFeature.trim() || null,
        improvement_suggestions: formData.improvementSuggestions.trim() || null,
        would_recommend: formData.wouldRecommend,
        additional_comments: formData.additionalComments.trim() || null,
      });

      if (dbError) throw dbError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke("send-feedback-email", {
        body: formData,
      });

      if (emailError) {
        console.error("Email notification failed:", emailError);
        // Don't fail the submission if email fails - feedback is saved
      }

      setSubmitted(true);
      toast({
        title: "Thank you for your feedback!",
        description: "Your insights help us improve the SCRF platform.",
      });
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Submission failed",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-8 pb-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Thank You!</h2>
              <p className="text-muted-foreground">
                Your feedback has been submitted successfully. We truly appreciate you taking the time to help us improve.
              </p>
              <div className="pt-4 flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
                {user && (
                  <Button onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Share Your Feedback</CardTitle>
              <CardDescription>
                Help us improve the SCRF platform by sharing your experience. Your insights are invaluable.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Info */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Smith"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@company.com"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>

                {/* Ratings */}
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-semibold">Rate Your Experience</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <RatingInput
                      label="Overall Experience *"
                      value={formData.overallExperience}
                      onChange={(val) => handleRatingChange("overallExperience", val)}
                    />
                    <RatingInput
                      label="Tool Usefulness *"
                      value={formData.toolUsefulness}
                      onChange={(val) => handleRatingChange("toolUsefulness", val)}
                    />
                    <RatingInput
                      label="Perceived Value *"
                      value={formData.perceivedValue}
                      onChange={(val) => handleRatingChange("perceivedValue", val)}
                    />
                    <RatingInput
                      label="Ease of Use *"
                      value={formData.easeOfUse}
                      onChange={(val) => handleRatingChange("easeOfUse", val)}
                    />
                  </div>
                </div>

                {/* Would Recommend */}
                <div className="space-y-3">
                  <Label>Would you recommend SCRF to others? *</Label>
                  <RadioGroup
                    value={formData.wouldRecommend === null ? "" : formData.wouldRecommend ? "yes" : "no"}
                    onValueChange={(val) => setFormData({ ...formData, wouldRecommend: val === "yes" })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="recommend-yes" />
                      <Label htmlFor="recommend-yes" className="cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="recommend-no" />
                      <Label htmlFor="recommend-no" className="cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Text Fields */}
                <div className="space-y-2">
                  <Label htmlFor="mostUsefulFeature">What feature do you find most useful?</Label>
                  <Textarea
                    id="mostUsefulFeature"
                    name="mostUsefulFeature"
                    placeholder="e.g., The SPOF Finder helped me identify key risks..."
                    value={formData.mostUsefulFeature}
                    onChange={handleChange}
                    rows={2}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="improvementSuggestions">How can we improve?</Label>
                  <Textarea
                    id="improvementSuggestions"
                    name="improvementSuggestions"
                    placeholder="Share any suggestions for improvements or new features..."
                    value={formData.improvementSuggestions}
                    onChange={handleChange}
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalComments">Additional Comments</Label>
                  <Textarea
                    id="additionalComments"
                    name="additionalComments"
                    placeholder="Any other thoughts you'd like to share..."
                    value={formData.additionalComments}
                    onChange={handleChange}
                    rows={3}
                    maxLength={1000}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Feedback;

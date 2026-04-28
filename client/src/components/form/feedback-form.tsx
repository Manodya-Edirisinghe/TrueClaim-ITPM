"use client";

import React, { useState } from "react";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { FormTextarea } from "./form-textarea";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface FeedbackFormData {
  caseNumber: string;
  interactionType: string;
  outcome: string;
  itemCategory: string;
  easeOfReporting: number;
  speedOfResponse: number;
  platformNavigation: number;
  staffHelpfulness: number;
  overallSatisfaction: number;
  improvementSuggestions: string;
  wouldRecommend: string;
  additionalComments: string;
}

const INITIAL_DATA: FeedbackFormData = {
  caseNumber: "",
  interactionType: "",
  outcome: "",
  itemCategory: "",
  easeOfReporting: 0,
  speedOfResponse: 0,
  platformNavigation: 0,
  staffHelpfulness: 0,
  overallSatisfaction: 0,
  improvementSuggestions: "",
  wouldRecommend: "",
  additionalComments: "",
};

const PAGE_TITLES = ["The Basics", "How Did We Do?", "Your Insights"];
const PAGE_DESCS = [
  "Help us track which types of lost items and locations have the best recovery rates.",
  "Please rate your experience on a scale of 1 to 5.",
  "Help us improve by sharing your thoughts and suggestions.",
];

const labelCls = "block mb-1.5 text-xs font-medium text-white/60";

export const FeedbackForm: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FeedbackFormData>(INITIAL_DATA);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (fieldName: string, value: number) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleNext = () => { if (currentPage < 3) setCurrentPage(currentPage + 1); };
  const handlePrevious = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      console.log(data);
      alert("Feedback submitted successfully!");
      setFormData(INITIAL_DATA);
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
      alert("Error submitting feedback");
    }
  };

  const isPage1Valid = () =>
    formData.caseNumber.trim() !== "" &&
    formData.interactionType !== "" &&
    formData.outcome !== "" &&
    formData.itemCategory !== "";

  const isPage2Valid = () =>
    formData.easeOfReporting > 0 &&
    formData.speedOfResponse > 0 &&
    formData.platformNavigation > 0 &&
    formData.staffHelpfulness > 0 &&
    formData.overallSatisfaction > 0;

  const isPage3Valid = () =>
    formData.improvementSuggestions.trim() !== "" &&
    formData.wouldRecommend !== "";

  const RatingComponent: React.FC<{ label: string; fieldName: string; value: number }> = ({
    label, fieldName, value,
  }) => (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleRatingChange(fieldName, num)}
            className={`flex size-11 items-center justify-center rounded-xl border text-sm font-semibold transition-all ${
              value === num
                ? "border-blue-500 bg-[#0A66C2] text-white shadow-lg shadow-blue-900/40"
                : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-white/30">1 = Poor · 5 = Excellent</p>
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-black/30">

      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-2">
          {[1, 2, 3].map((page) => (
            <div
              key={page}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                page < currentPage
                  ? "bg-green-500"
                  : page === currentPage
                  ? "bg-[#0A66C2]"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">Step {currentPage} of 3</p>
      </div>

      {/* Page heading */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">{PAGE_TITLES[currentPage - 1]}</h2>
        <p className="mt-1 text-sm text-white/50">{PAGE_DESCS[currentPage - 1]}</p>
      </div>

      <form onSubmit={handleSubmit}>

        {/* PAGE 1 */}
        {currentPage === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Case / Reference Number</label>
              <FormInput
                type="text"
                name="caseNumber"
                placeholder="Enter your case or reference number"
                value={formData.caseNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Type of Interaction</label>
              <FormSelect
                name="interactionType"
                value={formData.interactionType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an interaction type</option>
                <option value="lost-item">I lost an item</option>
                <option value="found-item">I found an item</option>
                <option value="browsing-database">I was browsing the database</option>
              </FormSelect>
            </div>

            <div>
              <label className={labelCls}>Outcome</label>
              <FormSelect
                name="outcome"
                value={formData.outcome}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an outcome</option>
                <option value="yes">Yes, I recovered the item</option>
                <option value="no">No, I did not recover it</option>
                <option value="pending">Still pending</option>
              </FormSelect>
            </div>

            <div>
              <label className={labelCls}>Item Category</label>
              <FormSelect
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleInputChange}
                required
              >
                <option value="">Select an item category</option>
                <option value="electronics">Electronics</option>
                <option value="keys">Keys</option>
                <option value="wallet">Wallet</option>
                <option value="clothing">Clothing</option>
                <option value="jewelry">Jewelry</option>
                <option value="documents">Documents</option>
                <option value="other">Other</option>
              </FormSelect>
            </div>
          </div>
        )}

        {/* PAGE 2 */}
        {currentPage === 2 && (
          <div className="space-y-6">
            <RatingComponent label="Ease of Reporting"   fieldName="easeOfReporting"   value={formData.easeOfReporting} />
            <RatingComponent label="Speed of Response"   fieldName="speedOfResponse"   value={formData.speedOfResponse} />
            <RatingComponent label="Platform Navigation" fieldName="platformNavigation" value={formData.platformNavigation} />
            <RatingComponent label="Staff Helpfulness"   fieldName="staffHelpfulness"  value={formData.staffHelpfulness} />
            <RatingComponent label="Overall Satisfaction" fieldName="overallSatisfaction" value={formData.overallSatisfaction} />
          </div>
        )}

        {/* PAGE 3 */}
        {currentPage === 3 && (
          <div className="space-y-5">
            <div>
              <label className={labelCls}>What could we have done better?</label>
              <FormTextarea
                name="improvementSuggestions"
                placeholder="Share your suggestions for improvement..."
                value={formData.improvementSuggestions}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

            <div>
              <label className={labelCls}>Would you recommend this system to others?</label>
              <FormSelect
                name="wouldRecommend"
                value={formData.wouldRecommend}
                onChange={handleInputChange}
                required
              >
                <option value="">Select your answer</option>
                <option value="definitely-yes">Definitely yes — highly recommended</option>
                <option value="probably-yes">Probably yes</option>
                <option value="neutral">Neutral</option>
                <option value="probably-no">Probably not</option>
                <option value="definitely-no">Definitely not</option>
              </FormSelect>
            </div>

            <div>
              <label className={labelCls}>Additional Comments</label>
              <FormTextarea
                name="additionalComments"
                placeholder="Any additional feedback or praise?"
                value={formData.additionalComments}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3 border-t border-white/[0.06] pt-6">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>

          {currentPage < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (currentPage === 1 && !isPage1Valid()) ||
                (currentPage === 2 && !isPage2Valid())
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0A66C2] to-[#1789FF] py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isPage3Valid()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-900/30 transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              <Send className="size-4" />
              Submit Feedback
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

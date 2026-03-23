"use client";

import React, { useState } from "react";
import { FormInput } from "./form-input";
import { FormSelect } from "./form-select";
import { FormTextarea } from "./form-textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FeedbackFormData {
  // Page 1 - Basics
  caseNumber: string;
  interactionType: string;
  outcome: string;
  itemCategory: string;

  // Page 2 - Performance Metrics
  easeOfReporting: number;
  speedOfResponse: number;
  platformNavigation: number;
  staffHelpfulness: number;
  overallSatisfaction: number;

  // Page 3 - Qualitative Insights
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

export const FeedbackForm: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<FeedbackFormData>(INITIAL_DATA);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (fieldName: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleNext = () => {
    if (currentPage < 3) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:5000/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log(data);

    alert("Feedback submitted successfully!");

    // reset form after successful submit
    setFormData(INITIAL_DATA);
    setCurrentPage(1);
  } catch (error) {
    console.error(error);
    alert("Error submitting feedback");
  }
};

  const isPage1Valid = () => {
    return (
      formData.caseNumber.trim() !== "" &&
      formData.interactionType !== "" &&
      formData.outcome !== "" &&
      formData.itemCategory !== ""
    );
  };

  const isPage2Valid = () => {
    return (
      formData.easeOfReporting > 0 &&
      formData.speedOfResponse > 0 &&
      formData.platformNavigation > 0 &&
      formData.staffHelpfulness > 0 &&
      formData.overallSatisfaction > 0
    );
  };

  const isPage3Valid = () => {
    return (
      formData.improvementSuggestions.trim() !== "" &&
      formData.wouldRecommend !== ""
    );
  };

  const RatingComponent: React.FC<{
    label: string;
    fieldName: string;
    value: number;
  }> = ({ label, fieldName, value }) => (
    <div className="mb-6">
      <Label className="block mb-3 text-gray-200">{label}</Label>
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleRatingChange(fieldName, num)}
            className={`w-12 h-12 rounded-lg font-semibold transition-all ${
              value === num
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        1 = Poor, 5 = Excellent
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-950 rounded-lg shadow-md border border-gray-800">
      {/* Page Indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {[1, 2, 3].map((page) => (
            <div
              key={page}
              className={`flex-1 h-2 mx-1 rounded-full transition-colors ${
                page === currentPage
                  ? "bg-blue-600"
                  : page < currentPage
                    ? "bg-green-500"
                    : "bg-gray-700"
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-gray-400">
          Page {currentPage} of 3
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* PAGE 1: THE BASICS */}
        {currentPage === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                The Basics
              </h2>
              <p className="text-gray-400 text-sm">
                Help us track which types of lost items and locations have the
                best recovery rates.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseNumber" className="text-gray-200">Case/Reference Number</Label>
              <FormInput
                type="text"
                id="caseNumber"
                name="caseNumber"
                placeholder="Enter your case or reference number"
                value={formData.caseNumber}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white !placeholder-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interactionType" className="text-gray-200">Type of Interaction</Label>
              <FormSelect
                id="interactionType"
                name="interactionType"
                value={formData.interactionType}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white"
                required
              >
                <option value="">Select an interaction type</option>
                <option value="lost-item">I lost an item</option>
                <option value="found-item">I found an item</option>
                <option value="browsing-database">
                  I was browsing the database
                </option>
              </FormSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome" className="text-gray-200">Outcome</Label>
              <FormSelect
                id="outcome"
                name="outcome"
                value={formData.outcome}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white"
                required
              >
                <option value="">Select an outcome</option>
                <option value="yes">Yes, I recovered the item</option>
                <option value="no">No, I did not recover it</option>
                <option value="pending">Still pending</option>
              </FormSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemCategory" className="text-gray-200">Item Category</Label>
              <FormSelect
                id="itemCategory"
                name="itemCategory"
                value={formData.itemCategory}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white"
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

        {/* PAGE 2: PERFORMANCE METRICS */}
        {currentPage === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                How Did We Do?
              </h2>
              <p className="text-gray-400 text-sm">
                Please rate your experience on a scale of 1-5.
              </p>
            </div>

            <RatingComponent
              label="Ease of Reporting"
              fieldName="easeOfReporting"
              value={formData.easeOfReporting}
            />

            <RatingComponent
              label="Speed of Response"
              fieldName="speedOfResponse"
              value={formData.speedOfResponse}
            />

            <RatingComponent
              label="Platform Navigation"
              fieldName="platformNavigation"
              value={formData.platformNavigation}
            />

            <RatingComponent
              label="Staff Helpfulness"
              fieldName="staffHelpfulness"
              value={formData.staffHelpfulness}
            />

            <RatingComponent
              label="Overall Satisfaction"
              fieldName="overallSatisfaction"
              value={formData.overallSatisfaction}
            />
          </div>
        )}

        {/* PAGE 3: QUALITATIVE INSIGHTS */}
        {currentPage === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Your Insights Matter
              </h2>
              <p className="text-gray-400 text-sm">
                Help us improve by sharing your thoughts and suggestions.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvementSuggestions" className="text-gray-200">
                What could we have done better?
              </Label>
              <FormTextarea
                id="improvementSuggestions"
                name="improvementSuggestions"
                placeholder="Share your suggestions for improvement..."
                value={formData.improvementSuggestions}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white !placeholder-gray-500"
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wouldRecommend" className="text-gray-200">
                Would you recommend this system to others?
              </Label>
              <FormSelect
                id="wouldRecommend"
                name="wouldRecommend"
                value={formData.wouldRecommend}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white"
                required
              >
                <option value="">Select your answer</option>
                <option value="definitely-yes">
                  Definitely yes - highly recommended
                </option>
                <option value="probably-yes">Probably yes</option>
                <option value="neutral">Neutral</option>
                <option value="probably-no">Probably not</option>
                <option value="definitely-no">Definitely not</option>
              </FormSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalComments" className="text-gray-200">Additional Comments</Label>
              <FormTextarea
                id="additionalComments"
                name="additionalComments"
                placeholder="Any additional feedback or praise?"
                value={formData.additionalComments}
                onChange={handleInputChange}
                className="!bg-black !border-gray-700 !text-white !placeholder-gray-500"
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-800">
          <Button
            type="button"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            variant="outline"
            className="flex-1 border-gray-700 text-white hover:bg-gray-800"
          >
            Previous
          </Button>

          {currentPage < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={
                (currentPage === 1 && !isPage1Valid()) ||
                (currentPage === 2 && !isPage2Valid())
              }
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!isPage3Valid()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Submit Feedback
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

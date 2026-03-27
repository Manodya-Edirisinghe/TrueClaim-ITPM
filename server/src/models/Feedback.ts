import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  caseNumber: String,
  interactionType: String,
  outcome: String,
  itemCategory: String,

  easeOfReporting: Number,
  speedOfResponse: Number,
  platformNavigation: Number,
  staffHelpfulness: Number,
  overallSatisfaction: Number,

  improvementSuggestions: String,
  wouldRecommend: String,
  additionalComments: String,
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);
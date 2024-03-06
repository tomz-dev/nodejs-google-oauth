import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: String,
    googleId: String,
    name: String,
    picture: String,
    family_name: String,
  },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

userSchema.virtual("fullName").get(function () {
  return `${this.family_name} ${this.name}`;
});

const userModel = mongoose.model<mongoose.Document>("User", userSchema);
export default userModel;

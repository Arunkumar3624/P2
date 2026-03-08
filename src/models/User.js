import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "hr", "employee", "user", "Admin", "Manager"],
      default: "employee",
    },
  },
  { timestamps: true },
);

const bcryptHashPattern = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (bcryptHashPattern.test(this.password)) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (bcryptHashPattern.test(this.password)) {
    return bcrypt.compare(enteredPassword, this.password);
  }

  return enteredPassword === this.password;
};

userSchema.methods.hasHashedPassword = function () {
  return bcryptHashPattern.test(this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

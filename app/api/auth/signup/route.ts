import { NextResponse } from "next/server"
import { connectToMongoose, User } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    await connectToMongoose()

    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: "user",
    })

    await newUser.save()

    // Return user data (excluding password)
    const userData = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
    }

    return NextResponse.json({
      message: "Signup successful",
      user: userData,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

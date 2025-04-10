import { NextResponse } from "next/server"
import { connectToMongoose, User } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    await connectToMongoose()

    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Find the user
    const user = await User.findOne({ username })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // In a real app, use bcrypt to compare passwords
    // const isMatch = await bcrypt.compare(password, user.password);
    // For demo, we'll just check our simple prefix
    const isMatch = user.password === "hashed_" + password

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Return user data (excluding password)
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    }

    return NextResponse.json({
      message: "Login successful",
      user: userData,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

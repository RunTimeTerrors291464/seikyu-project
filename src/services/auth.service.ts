import apiClient from "./api-client";

// Function to call login API
export const login = async (data: {
  username: string;
  password: string;
}) => {

  // Debug log: check if login function is called and what data is sent
  console.log("AUTH SERVICE → login called", data);

  try {
    // Send POST request to backend login endpoint
    const res = await apiClient.post("/api/v1/auth/login", data);

    // Debug log: confirm API returned successfully
    console.log("AUTH SERVICE → login success", res.data);

    // Return API response data (usually contains token + user info)
    return res.data;

  } catch (error: any) {

    // Debug log: show backend error response
    console.error(
      "AUTH SERVICE → login failed",
      error.response?.data
    );

    // Re-throw error so the component or caller can handle it
    // (for example: show error message in UI)
    throw error; // VERY IMPORTANT
  }
};
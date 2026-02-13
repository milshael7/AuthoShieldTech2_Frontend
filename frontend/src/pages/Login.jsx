const submit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const result = await api.login(email, password);

    console.log("LOGIN RESPONSE:", result);

    // 🔎 Try multiple possible shapes
    const token =
      result?.token ||
      result?.jwt ||
      result?.access_token ||
      result?.accessToken ||
      result?.data?.token ||
      result?.data?.access_token ||
      "";

    const user =
      result?.user ||
      result?.data?.user ||
      null;

    if (!token) {
      throw new Error("Invalid login response from server");
    }

    setToken(token);
    if (user) saveUser(user);

    const role = String(user?.role || "").toLowerCase();

    if (role === "admin") navigate("/admin");
    else if (role === "manager") navigate("/manager");
    else if (role === "company") navigate("/company");
    else navigate("/user");

  } catch (err) {
    alert(err?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};

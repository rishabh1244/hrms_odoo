import { FormEvent, useState, ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    role: "",
    first_name: "",
    last_name: "",
    email: "",
    country_code: "+1",
    phone_number: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    company_name: "",
    role: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const validateField = (name: string, value: string) => {
    let error = "";
    switch (name) {
      case "company_name":
        if (!value) error = "Company Name is required";
        break;
      case "role":
        if (!value) error = "Please select a role";
        break;
      case "first_name":
        if (!value) error = "First Name is required";
        break;
      case "last_name":
        if (!value) error = "Last Name is required";
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Enter a valid email address";
        break;
      case "phone_number":
        if (!value) error = "Phone Number is required";
        else if (value.length !== 10) error = "Phone Number must be exactly 10 digits";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (value.length < 6) error = "Password must be at least 6 characters";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === "";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    
    if (name === "phone_number") {
      newValue = newValue.replace(/\D/g, "");
      if (newValue.length > 10) newValue = newValue.slice(0, 10);
    }
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (name !== "country_code") validateField(name, newValue);
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name !== "country_code") validateField(name, value);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    let isFormValid = true;
    Object.keys(errors).forEach((key) => {
      if (key !== "country_code" && !validateField(key, formData[key as keyof typeof formData])) {
        isFormValid = false;
      }
    });

    if (!isFormValid) return;

    setLoading(true);

    const body = {
      company_name: formData.company_name,
      name: `${formData.first_name} ${formData.last_name}`.trim(),
      email: formData.email,
      phone: formData.phone_number,
      role: formData.role,
      password: formData.password,
      confirm_password: formData.password,
    };

    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        Cookies.set("token", data.token, { expires: 7, secure: true, sameSite: "strict" });
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-odoo-cream px-4 py-8 sm:px-6">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl shadow-odoo-purple/10 ring-1 ring-black/5 sm:p-8 md:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-odoo-purple sm:text-4xl">
            Create Employee Account
          </h1>
          <p className="mt-3 text-odoo-muted">
            Register as an admin or HR.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <Input 
              label="Company Name" 
              name="company_name" 
              value={formData.company_name} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              error={errors.company_name} 
              placeholder="Enter company name"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-odoo-ink">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:border-odoo-purple focus:ring-2 focus:ring-odoo-purple/20 ${errors.role ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`}
              >
                <option value="" disabled>Select role</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>
              <span className="mt-1 block min-h-[16px] text-xs text-red-500">{errors.role}</span>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input 
              label="First Name" 
              name="first_name" 
              value={formData.first_name} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              error={errors.first_name} 
              placeholder="Enter first name"
            />
            <Input 
              label="Last Name" 
              name="last_name" 
              value={formData.last_name} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              error={errors.last_name} 
              placeholder="Enter last name"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Input 
              label="Email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              onBlur={handleBlur} 
              error={errors.email} 
              placeholder="Enter email address"
            />
            
            <div>
              <label className="mb-2 block text-sm font-medium text-odoo-ink">
                Phone Number
              </label>
              <div className="flex gap-2">
                <select
                  name="country_code"
                  value={formData.country_code}
                  onChange={handleChange}
                  className="w-[35%] rounded-xl border border-gray-200 bg-white px-2 py-3 outline-none transition focus:border-odoo-purple focus:ring-2 focus:ring-odoo-purple/20"
                >
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+61">+61 (AU)</option>
                </select>
                <div className="w-[65%]">
                  <input
                    name="phone_number"
                    type="text"
                    placeholder="10 digit number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full rounded-xl border bg-white px-4 py-3 outline-none transition focus:border-odoo-purple focus:ring-2 focus:ring-odoo-purple/20 ${errors.phone_number ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`}
                  />
                </div>
              </div>
              <span className="mt-1 block min-h-[16px] text-xs text-red-500">{errors.phone_number}</span>
            </div>
          </div>

          <Input 
            label="Password" 
            name="password" 
            type="password" 
            value={formData.password} 
            onChange={handleChange} 
            onBlur={handleBlur} 
            error={errors.password} 
            placeholder="••••••••••••"
          />

          <button
            type="submit"
            disabled={loading}
            className="
              mt-4
              w-full
              rounded-xl
              bg-odoo-purple
              py-3
              font-semibold
              text-white
              transition
              hover:bg-odoo-purple-dark
              disabled:opacity-50
            "
          >
            {loading ? "Registering…" : "Register Employee"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-odoo-muted">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-odoo-purple hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-odoo-ink">
        {label}
      </label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`
          w-full
          rounded-xl
          border
          bg-white
          px-4
          py-3
          outline-none
          transition
          focus:border-odoo-purple
          focus:ring-2
          focus:ring-odoo-purple/20
          ${error ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}
        `}
      />
      <span className="mt-1 block min-h-[16px] text-xs text-red-500">{error}</span>
    </div>
  );
}


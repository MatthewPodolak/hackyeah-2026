"use client"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useToast } from "@/helpers/ToastProvider"

const USER_TYPES = [
  { value: "obywatel", label: "Obywatel" },
  { value: "gpo", label: "GPO" },
  { value: "urzad", label: "Urząd" },
]

const EMPTY_REGISTER = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginForm({
  className,
  ...props
}) {
  const { showToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [selectedUserType, setSelectedUserType] = useState("obywatel");
  const [registerData, setRegisterData] = useState(EMPTY_REGISTER);
  const [loading, setLoading] = useState(false);

  const updateRegister = (field) => (e) =>
    setRegisterData((prev) => ({ ...prev, [field]: e.target.value }));

  const validateRegister = () => {
    const { name, email, password, confirmPassword } = registerData;

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      return "Proszę wypełnij wszystkie pola";
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return "Niepoprawny adres email";
    }
    if (password.length < 8) {
      return "Hasło musi mieć co najmniej 8 znaków";
    }
    if (password !== confirmPassword) {
      return "Hasła nie są takie same";
    }
    if (!USER_TYPES.some((t) => t.value === selectedUserType)) {
      return "Wybierz typ konta";
    }
    return null;
  };

  const register = async (e) => {
    e.preventDefault();
    if (loading) return;

    const error = validateRegister();
    if (error) {
      showToast(error, "error");
      return;
    }

    setLoading(true);


  };

  const loginInit = () => {
    
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        {isLogin ? (
          <>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                      <a
                        href="#"
                        className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </a>
                    </div>
                    <Input id="password" type="password" required />
                  </Field>
                  <Field>
                    <Button type="submit">Login</Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account? <a className="cursor-pointer" onClick={() => setIsLogin(false)}>Sign up</a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        ):(
          <>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Enter your details below to create your account
              </CardDescription>
            </CardHeader>
            <CardContent>

              <div className="w-full flex items-center justify-center py-3 flex-row gap-3 min-h-16">
                {USER_TYPES.map((type) => {
                  const selected = selectedUserType === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setSelectedUserType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 cursor-pointer rounded-lg border-2 px-4 py-3 min-w-24 transition-colors",
                        selected
                          ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-colors",
                          selected
                            ? "border-blue-500 bg-blue-500 text-white"
                            : "border-neutral-300 dark:border-neutral-700"
                        )}
                      >
                        {type.label[0]}
                      </div>
                      <p className="text-sm font-medium">{type.label}</p>
                    </button>
                  )
                })}
              </div>

              <form onSubmit={register} noValidate>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jan Kowalski"
                      value={registerData.name}
                      onChange={updateRegister("name")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-email">Email</FieldLabel>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="m@example.com"
                      value={registerData.email}
                      onChange={updateRegister("email")}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="register-password">Password</FieldLabel>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={updateRegister("password")}
                    />
                    <FieldDescription>Must be at least 8 characters long.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={updateRegister("confirmPassword")}
                    />
                  </Field>
                  <Field>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Tworzenie konta..." : "Create account"}
                    </Button>
                    <FieldDescription className="text-center">
                      Already have an account?{" "}
                      <a className="cursor-pointer" onClick={() => setIsLogin(true)}>
                        Login
                      </a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
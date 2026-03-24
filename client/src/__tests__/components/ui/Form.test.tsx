import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/__tests__/test-utils";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type TestFormValues = {
  username: string;
  email: string;
};

function TestForm() {
  const form = useForm<TestFormValues>({
    defaultValues: {
      username: "",
      email: "",
    },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>Your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

describe("Form", () => {
  it("renders form with field components", () => {
    render(<TestForm />);

    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
    expect(screen.getByText("Your public display name.")).toBeInTheDocument();
  });

  it("renders FormItem with correct structure", () => {
    render(<TestForm />);

    const label = screen.getByText("Username");
    expect(label.tagName.toLowerCase()).toBe("label");
  });

  it("composes className on FormItem", () => {
    function FormWithCustomClass() {
      const form = useForm<TestFormValues>({
        defaultValues: { username: "" },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              render={() => (
                <FormItem className="custom-form-item">
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    }

    render(<FormWithCustomClass />);

    const formItem = screen.getByLabelText("Username").closest(".space-y-2");
    expect(formItem).toHaveClass("custom-form-item");
  });

  it("renders FormDescription with correct styling", () => {
    render(<TestForm />);

    const description = screen.getByText("Your public display name.");
    expect(description.className).toMatch(/text-muted-foreground/);
  });

  it("renders FormMessage with error styling when error exists", () => {
    function FormWithError() {
      const form = useForm<TestFormValues>({
        defaultValues: { username: "" },
      });

      return (
        <Form {...form}>
          <form>
            <FormField
              control={form.control}
              name="username"
              render={() => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input />
                  </FormControl>
                  <FormMessage>Username is required</FormMessage>
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    }

    render(<FormWithError />);

    const message = screen.getByText("Username is required");
    expect(message.className).toMatch(/text-destructive/);
  });
});

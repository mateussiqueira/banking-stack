import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    className: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card Description</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-surface-400">
          This is the card content area. Add your content here.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="sm">
          Action
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Premium Plan</CardTitle>
        <CardDescription>
          Best for growing businesses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <span className="text-display-sm font-bold text-neutral-50">
            R$ 97
          </span>
          <span className="text-body-sm text-surface-400"> /mês</span>
        </div>
        <ul className="space-y-2">
          {["Feature 1", "Feature 2", "Feature 3"].map((f) => (
            <li key={f} className="text-body-sm text-surface-400">
              ✓ {f}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button variant="primary" size="lg" className="w-full">
          Subscribe
        </Button>
      </CardFooter>
    </Card>
  ),
};

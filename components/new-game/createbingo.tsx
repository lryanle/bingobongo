"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import crypto from "crypto";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { getTextColor, modifyColor } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { SetStateAction, useEffect, useState } from "react";
import { HexColorPicker, HexColorInput } from "react-colorful";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const teamNameSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
  )
  .min(1, "Team name cannot be empty")
  .max(32, "Team name too long");
const teamColorSchema = z
  .string()
  .min(4, "Invalid color")
  .max(9, "Invalid color")
  .regex(/^#/, "Invalid color format");

const formSchema = z.object({
  roomName: z
    .string()
    .regex(
      /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
    )
    .min(8, "Room name is required (at least 8 chars required)")
    .max(32, "Room name must be at most 32 chars long"),
  roomPassword: z
    .string()
    .regex(
      /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
    )
    .max(32, "Password must be at most 32 chars long")
    .optional(),
  bingoSeed: z
    .string()
    .regex(
      /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
    )
    .min(0, "Bingo seed must be a positive number")
    .max(32, "Bingo seed must be at most 32 chars long"),
  teams: z
    .array(
      z.object({
        name: teamNameSchema,
        color: teamColorSchema,
      }),
    )
    .min(2, "At least 2 teams required")
    .max(8, "At most 8 teams allowed"),
  bingoPreset: z.string(),
  gameMode: z.string(),
  boardSize: z.union([z.literal("3x3"), z.literal("5x5"), z.literal("7x7")]),
  importBingoData: z
    .string()
    .regex(
      /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
    )
    .optional(),
  delimiter: z
    .string()
    .regex(
      /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
    )
    .optional(),
});

export interface CreateBingoProps {
  partyleader: string;
  // modeName: string;
  // lobbyName: string;
  // mode: "default" | "battleship",
  // size: number,
  // bingoData: [{
  //   title?: string,
  //   slotItems?: [{color: string, number: number}],
  //   favorite?: boolean,
  //   locked?: boolean,
  //   disabled?: boolean,
  // }],
  // battleshipData?: [{position: [x: number, y: number], number: number}]
}

function getDefaults<Schema extends z.AnyZodObject>(schema: Schema) {
  return Object.fromEntries(
    Object.entries(schema.shape).map(([key, value]) => {
      if (value instanceof z.ZodDefault)
        return [key, value._def.defaultValue()];
      return [key, undefined];
    }),
  );
}

//Need: lobby owner's username,
export default function CreateBingo({ partyleader }: CreateBingoProps) {
  const [roomName, setRoomName] = useState(`${partyleader}'s Room`);
  const [bingoSeed, setBingoSeed] = useState("");
  const [teams, setTeams] = useState([
    { name: "Team 1", color: "#b91c1c" },
    { name: "Team 2", color: "#eab308" },
    { name: "Team 3", color: "#16a34a" },
    { name: "Team 4", color: "#1d4ed8" },
  ]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomName: roomName,
      bingoSeed: bingoSeed,
      teams: teams,
      bingoPreset: "default",
      gameMode: "default",
      boardSize: "5x5",
    },
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setBingoSeed(crypto.randomBytes(20).toString("hex"));
  }, []);

  useEffect(() => {
    form.setValue("teams", teams);
  }, [teams, form]);

  // Add Team
  const handleAddTeam = () => {
    const newTeam = {
      name: `Team ${teams.length + 1}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    }; // Adjust as needed
    setTeams([...teams, newTeam]);
  };

  const handleRemoveTeam = (index: number) => {
    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);
    console.log(newTeams);
  };

  const handleNameChange = (name: string, index: number) => {
    const result = teamNameSchema.safeParse(name);
    if (result.success) {
      const updatedTeams = teams.map((team, i) =>
        i === index ? { ...team, name: name } : team,
      );
      setTeams(updatedTeams);
    }
  };

  const handleColorChange = (color: string, index: number) => {
    const result = teamColorSchema.safeParse(color);
    if (result.success) {
      setTeams(
        teams.map((team, i) =>
          i === index ? { ...team, color: color } : team,
        ),
      );
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  };

  return (
    <div className="inline-flex w-[calc(100%-1rem)] md:w-auto m-2 md:m-0 md:p-5 flex-col justify-center items-center gap-2 rounded-3xl bg-primary-foreground  shadow">
      <div className="flex bg-secondary m-4 py-4 md:m-0 md:py-8 flex-col items-center gap-3 self-stretch rounded-2xl bg-opacity-50 backdrop-blur-xl text-primary text-center font-semibold text-4xl md:text-6xl shadow">
        New Bingo
      </div>
      <div className="flex py-2 px-4 md:px-32 flex-col items-center gap-4 self-stretch">
        <div className="flex flex-col items-start gap-4 self-stretch">
          {mounted ? (
            <Form {...form}>
              <FormField
                control={form.control}
                name="roomName"
                render={({ field }) => (
                  <FormItem className="w-full md:auto">
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder={roomName} {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.roomName?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomPassword"
                render={({ field }) => (
                  <FormItem className="w-full md:auto">
                    <FormLabel>Room Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.roomPassword?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bingoSeed"
                render={({ field }) => (
                  <FormItem className="w-full md:auto">
                    <FormLabel>Bingo Seed</FormLabel>
                    <FormControl>
                      <Input placeholder={bingoSeed} {...field} />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.bingoSeed?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teams"
                render={({ field }) => (
                  <FormItem className="w-full md:auto mb-2 md:mb-0">
                    <FormLabel>Teams</FormLabel>
                    <FormControl>
                      <div className="flex flex-row gap-2 md:flex-wrap overflow-x-scroll md:overflow-x-auto">
                        {teams.map(({ name, color }, i) => (
                          <div
                            key={`team-${i}`}
                            className="flex h-10 transition-all text-sm font-medium px-5 hover:pr-9 hover:pl-9 items-center gap-2 rounded-lg text-primary group relative cursor-default"
                            style={{
                              backgroundColor: color,
                              color: modifyColor(
                                color,
                                getTextColor(color) === "white" ? 65 : -65,
                              ),
                            }}
                          >
                            <span
                              key={`paint-${i}`}
                              className="flex absolute inset-y-0 left-2.5 items-center justify-center w-4 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="link"
                                    type="button"
                                    size="icon"
                                    style={{
                                      color: modifyColor(
                                        color,
                                        getTextColor(color) === "white"
                                          ? 65
                                          : -65,
                                      ),
                                    }}
                                  >
                                    <Icons.edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle className="text-2xl">
                                      Editting {name}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Make team modifications here. Changes are
                                      updated automatically.
                                    </DialogDescription>
                                  </DialogHeader>

                                  <Tabs defaultValue="account">
                                    <TabsList className="grid w-full grid-cols-3">
                                      <TabsTrigger value="name">
                                        Name
                                      </TabsTrigger>
                                      <TabsTrigger value="color">
                                        Color
                                      </TabsTrigger>
                                      <TabsTrigger value="remove">
                                        Remove
                                      </TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="name">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Team Name
                                          </CardTitle>
                                          <CardDescription>
                                            Make changes to{" "}
                                            <code className="bg-muted line-sp tracking-widest rounded p-0.5">
                                              {name}
                                            </code>
                                            &apos;s name here. Click save when
                                            you&apos;re done.
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                          <div className="space-y-1">
                                            <Input
                                              id="name"
                                              defaultValue={name}
                                              placeholder="Team Name (can't be empty)"
                                              onChange={(e) =>
                                                handleNameChange(
                                                  e.target.value,
                                                  i,
                                                )
                                              }
                                              autoFocus
                                            />
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                    <TabsContent value="color">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Team Color
                                          </CardTitle>
                                          <CardDescription>
                                            Modify{" "}
                                            <code className="bg-muted line-sp tracking-widest rounded p-0.5">
                                              {name}
                                            </code>
                                            &apos;s hex color value here. Hex
                                            values are accepted in the form of{" "}
                                            <code className="bg-muted line-sp tracking-widest rounded p-0.5">
                                              #RRGGBB
                                            </code>{" "}
                                            or in the short form{" "}
                                            <code className="bg-muted line-sp tracking-widest rounded p-0.5">
                                              #RGB
                                            </code>
                                            .
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                          <div className="space-y-1">
                                            <div>
                                              <HexColorPicker
                                                id="color"
                                                style={{
                                                  width: "100%",
                                                  borderRadius:
                                                    "0.375rem 0.375rem 0 0",
                                                }}
                                                color={color}
                                                onChange={(color) =>
                                                  handleColorChange(color, i)
                                                }
                                              />
                                              <div className="flex h-10 mt-4 w-full rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                                <HexColorInput
                                                  id="color"
                                                  style={{
                                                    width: "100%",
                                                    backgroundColor:
                                                      "transparent",
                                                    padding: ".75rem .5rem",
                                                  }}
                                                  color={color}
                                                  onChange={(color) =>
                                                    handleColorChange(color, i)
                                                  }
                                                  prefixed
                                                  autoFocus
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                    <TabsContent value="remove">
                                      <Card>
                                        <CardHeader>
                                          <CardTitle className="text-lg">
                                            Remove Team
                                          </CardTitle>
                                          <CardDescription>
                                            Permanently remove team{" "}
                                            <code className="bg-muted line-sp tracking-widest rounded p-0.5">
                                              {name}
                                            </code>
                                            . This action cannot be undone.
                                          </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                          <div className="space-y-1">
                                            {/* <DialogClose asChild> */}
                                            <Button
                                              id="name"
                                              type="button"
                                              variant="destructive"
                                              onClick={() =>
                                                handleRemoveTeam(i)
                                              }
                                            >
                                              Remove {name}
                                            </Button>
                                            {/* </DialogClose> */}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </TabsContent>
                                  </Tabs>

                                  <DialogFooter className="sm:justify-start">
                                    <DialogClose asChild>
                                      <Button type="button" variant="secondary">
                                        Close
                                      </Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </span>
                            <span key={`name-${i}`} className="flex-1 text-nowrap">
                              {name}
                            </span>
                            <span
                              key={`remove-${i}`}
                              className="flex absolute inset-y-0 right-2.5 items-center justify-center w-4 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Button
                                variant="link"
                                type="button"
                                size="icon"
                                style={{
                                  color: modifyColor(
                                    color,
                                    getTextColor(color) === "white" ? 65 : -65,
                                  ),
                                }}
                                onClick={() => handleRemoveTeam(i)}
                              >
                                <Icons.minus />
                              </Button>
                            </span>
                          </div>
                        ))}
                        {teams.length < 8 && (
                          <Button
                            variant="secondary"
                            type="button"
                            className="flex h-10 px-2.5 items-center gap-2 rounded-lg"
                            onClick={handleAddTeam}
                          >
                            Add Team
                            <Icons.plus />
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.teams?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </Form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="space-y-3 mt-0.5">
                <Skeleton className="h-[17px] w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-3 mt-0.5">
                <Skeleton className="h-[17px] w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-3 mt-0.5">
                <Skeleton className="h-[17px] w-28" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-3 mt-0.5 mb-2">
                <Skeleton className="h-[17px] w-28" />
                <div className="flex flex-row gap-2">
                  <Skeleton className="h-10 w-[86px]" />
                  <Skeleton className="h-10 w-[86px]" />
                  <Skeleton className="h-10 w-[86px]" />
                  <Skeleton className="h-10 w-[86px]" />
                  <Skeleton className="h-10 w-[107px]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
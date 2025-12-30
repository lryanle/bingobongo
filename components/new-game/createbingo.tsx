"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import crypto from "crypto";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Icons } from "@/components/icons";
import { getAllValues, getTextColor, isJson, modifyColor, sanitize } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { useCallback, useEffect, useState } from "react";
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
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bingoConfig } from "@/config/bingo";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import DOMPurify from "dompurify";
import { useRouter } from "next/navigation";

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
  boardSize: z.custom<number[]>((val) => { return Array.isArray(val) && val.length === 1 && (val[0] === 0 || val[0] === 50 || val[0] === 100); }, { message: "Invalid board size. Allowed sizes are [0], [50], [100]", }),
  importBingoData: z
    .array(z
      .string()
      .regex(
        /^[A-Za-z0-9\_\+\-\=\!\@\#\$\%\^\&\*\(\)\[\]\{\}\\\|\;\'\:\"\,\.\<\>\/\?\`\~\s]*$/,
      ))
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
  leaderid: string | undefined;
}

export default function CreateBingo ({ partyleader, leaderid }: CreateBingoProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roomName] = useState(`${partyleader}'s Room`);
  const [bingoSeed] = useState<string>(crypto.randomBytes(16).toString("hex"));
  // const [preset, setPreset] = useState(""); // to be used for games
  const [teams, setTeams] = useState([
    { name: "Team 1", color: "#b91c1c" },
    { name: "Team 2", color: "#1d4ed8" },
  ]);
  const [delimiter, setDelimiter] = useState(",");
  const [importText, setImportText] = useState("");
  const [parsedData, setParsedData] = useState<string[]>([]);
  const [importTab, setImportTab] = useState("inputData");

  const signedout = leaderid === undefined;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomName: roomName,
      roomPassword: "",
      bingoSeed: bingoSeed,
      teams: teams,
      bingoPreset: "default",
      gameMode: "classic-bingo",
      boardSize: [50],
      importBingoData: parsedData,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    form.setValue("teams", teams);
  }, [teams, form]);
  
  const parseData = useCallback(() => {
    try {
      if (isJson(importText) || delimiter.toLowerCase().includes("json")) {
        const data = getAllValues(JSON.parse(importText))
        setParsedData(data);
        setImportTab("viewData");
  
        form.setValue("importBingoData", data);
      } else {
        let data: string[] = [];
        
        // Handle newline delimiter specially
        if (delimiter === "\\n" || delimiter === "\n") {
          // Split by newlines and filter out empty lines
          data = importText.split(/\r?\n/)
            .map(item => item.trim().replace(/^['"`](.*)['"`]$/, '$1'))
            .filter(str => str !== "" && str.trim() !== "");
        } else {
          // Use regex for other delimiters
          const pattern = `(${sanitize(delimiter)})(?=(?:(?:[^"']|"(?:[^"\\\\]|\\\\.)*"|'(?:[^'\\\\]|\\\\.)*')*$))`;
          const regex = new RegExp(pattern, 'g');
          
          data = importText.split(regex)
            .map(item => item.trim().replace(/^['"`](.*)['"`]$/, '$1'))
            .filter(str => str !== "" && str !== " " && str.trim() !== delimiter.trim());
        }

        setParsedData(data);
        setImportTab("viewData");
        form.setValue("importBingoData", data);
      }
    } catch (e) {
      console.error("Error parsing data:", e);
      setParsedData([]);
      form.setValue("importBingoData", []);
    }
  }, [delimiter, importText, form]);
  


  const handleAddTeam = () => {
    const newTeam = {
      name: `Team ${teams.length + 1}`,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
    setTeams([...teams, newTeam]);
  };

  const handleRemoveTeam = (index: number) => {
    const newTeams = teams.filter((_, i) => i !== index);
    setTeams(newTeams);
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

  const [existingRoom, setExistingRoom] = useState<{
    id: string;
    roomName: string;
    gameMode: string;
    playerCount: number;
    activityCount: number;
  } | null>(null);
  const [showOverwriteDialog, setShowOverwriteDialog] = useState(false);
  const [pendingRoomData, setPendingRoomData] = useState<z.infer<typeof formSchema> | null>(null);

  // Check for existing room on mount
  useEffect(() => {
    if (leaderid) {
      fetch('/api/rooms/stats')
        .then((res) => res.json())
        .then((data) => {
          if (data.room) {
            setExistingRoom(data.room);
          }
        })
        .catch((err) => console.error('Error fetching room stats:', err));
    }
  }, [leaderid]);

  const createRoom = async (roomData: {
    roomName: string;
    roomPassword?: string;
    bingoSeed: string;
    gameMode: string;
    boardSize: number[];
    teams: Array<{ name: string; color: string }>;
    ownerId: string;
  }) => {
    const formData = new FormData();
    formData.append("id", DOMPurify.sanitize(roomData.ownerId));
    formData.append("roomData", JSON.stringify(roomData));
    
    try {
      const response = await fetch('/api/room', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const roomId = await response.text();
      
      if (roomId) {
        // Reset submitting state before navigation
        setIsSubmitting(false);
        // Redirect to the created room
        router.push(`/bingo/${roomId}`);
      } else {
        throw new Error('Room ID not returned from server');
      }
    } catch (e) {
      console.error('There was a problem creating the room:', e);
      setIsSubmitting(false);
      alert('Failed to create room. Please try again.');
      // Re-throw error so caller can handle it
      throw e;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!leaderid) return; // Guard against undefined leaderid
    
    // Calculate minimum items needed based on board size
    const boardSizeValue = values.boardSize[0];
    const gridSize = boardSizeValue === 0 ? 5 : boardSizeValue === 50 ? 7 : 10;
    const minItems = gridSize * gridSize;
    
    // Get bingo items from form
    const bingoItems = values.importBingoData || [];
    
    // Filter out empty strings for validation (matching server-side validation)
    const validItems = bingoItems.filter((item: string) => item && item.trim() !== "");
    
    // Validate minimum items
    if (validItems.length < minItems) {
      alert(`Please provide at least ${minItems} bingo items (current: ${validItems.length} valid items out of ${bingoItems.length} total). The board size ${gridSize}x${gridSize} requires ${minItems} items.`);
      setIsSubmitting(false);
      return;
    }
    
    const roomData = {
      roomName: values.roomName,
      roomPassword: values.roomPassword || undefined,
      bingoSeed: values.bingoSeed,
      gameMode: values.gameMode,
      boardSize: values.boardSize,
      teams: values.teams,
      ownerId: leaderid,
      bingoItems: bingoItems, // Include bingo items
    };

    // Check if user has an existing room
    if (existingRoom) {
      setPendingRoomData(values);
      setShowOverwriteDialog(true);
      return;
    }

    // No existing room, create directly
    setIsSubmitting(true);
    await createRoom(roomData);
  };

  const handleOverwrite = async () => {
    if (!pendingRoomData || !leaderid) return;
    
    setIsSubmitting(true);
    
    // Calculate minimum items needed based on board size
    const boardSizeValue = pendingRoomData.boardSize[0];
    const gridSize = boardSizeValue === 0 ? 5 : boardSizeValue === 50 ? 7 : 10;
    const minItems = gridSize * gridSize;
    
    // Get bingo items from pending room data
    const bingoItems = pendingRoomData.importBingoData || [];
    
    // Filter out empty strings for validation (matching server-side validation)
    const validItems = bingoItems.filter((item: string) => item && item.trim() !== "");
    
    // Validate minimum items
    if (validItems.length < minItems) {
      alert(`Please provide at least ${minItems} bingo items (current: ${validItems.length} valid items out of ${bingoItems.length} total). The board size ${gridSize}x${gridSize} requires ${minItems} items.`);
      setIsSubmitting(false);
      return;
    }
    
    const roomData = {
      roomName: pendingRoomData.roomName,
      roomPassword: pendingRoomData.roomPassword || undefined,
      bingoSeed: pendingRoomData.bingoSeed,
      gameMode: pendingRoomData.gameMode,
      boardSize: pendingRoomData.boardSize,
      teams: pendingRoomData.teams,
      ownerId: leaderid,
      bingoItems: bingoItems, // Include bingo items
    };

    try {
      await createRoom(roomData);
      // Only close dialog on success - createRoom handles navigation
      setShowOverwriteDialog(false);
    } catch (error) {
      // Error is already handled in createRoom (shows alert)
      // Dialog remains open so user can try again or cancel
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inline-flex w-[calc(100%-1rem)] md:w-auto m-2 md:m-0 md:p-5 flex-col justify-center items-center gap-2 rounded-3xl bg-primary-foreground shadow">
      <div className="flex bg-secondary m-4 md:m-0 py-4 flex-col items-center gap-3 self-stretch rounded-2xl bg-opacity-50 backdrop-blur-xl text-primary text-center font-semibold text-4xl shadow">
        New Bingo
      </div>
      <div className="flex md:py-2 px-4 md:px-8 flex-col items-center gap-4 pb-4 self-stretch">
        <div className="flex flex-col items-start gap-4 self-stretch md:w-[34rem]">
          {mounted ? (
            <Form {...form}> {/* FIXME: XSS Vulnerability*/}
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col items-start gap-4 self-stretch md:w-[34rem]">
                <FormField
                  control={form.control}
                  name="roomName"
                  render={({ field }) => (
                    <FormItem className="w-full md:auto">
                      <div className="flex flex-row justify-center items-center">
                        <FormLabel className="whitespace-nowrap w-48">Room Name</FormLabel>
                        <FormControl>
                          <Input placeholder={roomName} {...field} disabled={signedout} />
                        </FormControl>
                      </div>
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
                      <div className="flex flex-row justify-center items-center">
                        <FormLabel className="whitespace-nowrap w-48">Room Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Password"
                            disabled={signedout}
                            {...field}
                          />
                        </FormControl>
                      </div>
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
                      <div className="flex flex-row justify-center items-center">
                        <FormLabel className="whitespace-nowrap w-48">Bingo Seed</FormLabel>
                        <FormControl>
                          <Input placeholder="Bingo Seed" {...field} disabled={signedout} />
                        </FormControl>
                      </div>
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
                    <FormItem className="w-full md:auto">
                      <div className="flex flex-row justify-center items-center">
                        <FormLabel className="whitespace-nowrap w-68">Teams</FormLabel>
                        <FormControl>
                          <div className="flex flex-row w-[calc(100%-7.5rem)] md:w-[25.25rem] gap-2 ">
                            <ScrollArea className="w-96 whitespace-nowrap rounded-md border">
                              <div className="flex flex-row gap-3 p-2 shadow-inner pr-6">
                                {teams.map(({ name, color }, i) => (
                                  <div
                                    key={`team-${i}`}
                                    className="flex shadow h-10 transition-all text-sm font-medium px-5 hover:pr-9 hover:pl-9 items-center gap-2 rounded-lg text-primary group relative cursor-default"
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
                                            disabled={signedout}
                                          >
                                            <Icons.Edit className="w-4 h-4" />
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
                                        disabled={signedout}
                                      >
                                        <Icons.Minus />
                                      </Button>
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                            {teams.length < 8 && (
                              <Button
                                variant="secondary"
                                type="button"
                                className="flex shadow h-10 px-3 md:px-2.5 my-2 items-center gap-2 rounded-lg border-primary-foreground border"
                                onClick={handleAddTeam}
                                disabled={signedout}
                              >
                                <span className="hidden md:block">Add Team</span>
                                <Icons.Plus />
                              </Button>
                            )}
                          </div>
                        </FormControl>
                      </div>
                      <FormMessage>
                        {form.formState.errors.teams?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gameMode"
                  render={({ field }) => (
                    <FormItem className="w-full md:auto flex flex-row justify-between items-center mt-0">
                      <FormLabel className="whitespace-nowrap w-48">Bingo Mode</FormLabel>
                      <div className="w-full flex flex-col justify-center items-center">
                        <FormControl className="w-full">
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="w-full" style={{marginTop: 0}} disabled={signedout}>
                              <SelectValue placeholder="Select a Game Mode"/>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Bingo Game Modes</SelectLabel>
                                <Separator />
                                {bingoConfig.modes.map((preset, i) => {
                                  return (<SelectItem value={preset.name.toLowerCase().replaceAll(' ', '-')} key={i} disabled={!preset.enabled}>{preset.name}</SelectItem>)
                                })}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage className="text-muted-foreground mt-1">
                          {field.value !== "" && (
                            bingoConfig.modes.filter((preset) => preset.name.toLowerCase().replaceAll(' ', '-') === field.value)[0].description
                          )}
                        </FormMessage>
                        <FormMessage>
                          {form.formState.errors.bingoSeed?.message}
                        </FormMessage>
                      </div>


                      
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="boardSize"
                  render={({ field }) => (
                    <FormItem className="w-full md:auto flex flex-row justify-between items-center">
                      <FormLabel className="whitespace-nowrap w-48">
                        {"Board Size"}
                        <br />
                        <span className="text-xs text-secondary-foreground opacity-50">
                          {"(temp disabled)"}
                        </span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-col justify-center items-center w-full gap-2">
                          <Slider
                            max={100}
                            step={50}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled
                          />
                          <div className="flex flex-row justify-between items-center w-full">
                            <span aria-disabled="true" className="opacity-50">3x3</span>
                            <span>5x5</span>
                            <span aria-disabled="true" className="opacity-50">7x7</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.bingoSeed?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="importBingoData"
                  render={({ field }) => (
                    <FormItem className="w-full md:auto flex flex-row justify-between items-center">
                      <FormLabel className="whitespace-nowrap w-48">Bingo Data</FormLabel>
                      <FormControl>
                        <Dialog onOpenChange={() => {importTab.includes("inputTab") ? "" : setImportTab("inputData")}}>
                          <DialogTrigger disabled={signedout} asChild={!signedout} >
                            <div className="w-full md:w-[30rem] flex flex-row justify-end items-center gap-3 px-2" style={{marginTop: 0}}>
                              <Button type="button" variant="outline" className="w-full md:w-1/3" disabled={signedout}>Import Bingo Data</Button>
                              <div className="hidden md:w-[15.4rem] md:flex whitespace-nowrap rounded-md border overflow-x-scroll">
                                <div className="flex flex-row gap-3 p-2 shadow-inner py-3">
                                  {parsedData.length > 0 ? (
                                    parsedData.map((dataItem, i) => (
                                      <div key={i} className="text-sm flex justify-start items-center gap-2 px-2 py-1 bg-secondary text-secondary-foreground rounded-2xl text-wrap">
                                        <Badge className=" bg-primary text-primary-foreground px-1.5 py-0.5 h-5">{i+1}</Badge> 
                                        <span className="text-nowrap break-normal ">{dataItem}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div>No data imported</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] md:max-w-[28rem] flex flex-col items-center">
                            <DialogHeader className="md:w-full md:text-start md:px-7">
                              <DialogTitle>Import Bingo Data</DialogTitle>
                              <DialogDescription>
                                Upload, edit, and view bingo data here. 
                              </DialogDescription>
                            </DialogHeader>
                            <Tabs value={importTab} onValueChange={(value) => {setImportTab(value)}} className="w-[350px]">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="inputData">Input Data</TabsTrigger>
                                <TabsTrigger value="viewData">View Data</TabsTrigger>
                              </TabsList>
                              <TabsContent value="inputData">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Input Data</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="space-y-1">
                                      <Label htmlFor="name">Separator</Label>
                                      <CardDescription>
                                        Can separate by {" "}
                                        <code className="bg-muted line-sp rounded px-0.5 cursor-pointer text-accent-foreground" onClick={() => {setDelimiter(",")}}>commas {"(,)"}</code>,{" "}
                                        <code className="bg-muted line-sp rounded px-0.5 cursor-pointer text-accent-foreground" onClick={() => {setDelimiter("\\n")}}>new lines {"(\\n)"}</code>, {" "}
                                        <code className="bg-muted line-sp rounded px-0.5 cursor-pointer text-accent-foreground" onClick={() => {setDelimiter("JSON")}}>JSON {"(json)"}</code>, {" "}
                                        or custom <code className="bg-muted line-sp rounded px-0.5 cursor-pointer text-accent-foreground" onClick={() => {setDelimiter(",")}}><Link href="https://regexr.com" target="_blank">Regex</Link></code>. 
                                      </CardDescription>
                                      <Input id="delimeter" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                      <Label htmlFor="username">Import Data</Label>
                                      <CardDescription>Please wrap all items in double quotes <code className="bg-muted line-sp rounded p-0.5">&quot;</code>.</CardDescription>
                                      <Textarea 
                                        id="importText" 
                                        value={importText}
                                        placeholder='"Item 1", "Item 2", "Item 3", ...'
                                        onChange={(e) => setImportText(e.target.value)}
                                      />
                                    </div>
                                    <Button onClick={parseData}>Parse Data</Button>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              <TabsContent value="viewData">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>View Data</CardTitle>
                                    <CardDescription>
                                      View parsed bingo import data here. Data can be edited in the Input Data tab.
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <ScrollArea className="max-h-[17rem] w-full rounded-md border overflow-auto">
                                      <div className="p-4 space-y-1">
                                        {parsedData.length > 0 ? (
                                          parsedData.map((dataItem, i) => (
                                            <div key={i} className="w-full text-sm flex justify-start items-center gap-2 px-2 py-1 bg-secondary text-secondary-foreground rounded-2xl text-wrap overflow-auto">
                                              <Badge className=" bg-primary text-primary-foreground px-1.5 py-0.5 h-5">{i+1}</Badge> 
                                              <span className="text-wrap break-normal ">{dataItem}</span>
                                            </div>
                                          ))
                                        ) : (
                                          <div>No data imported</div>
                                        )}
                                      </div>
                                    </ScrollArea>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.bingoSeed?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <div className="flex w-full justify-center">
                  <Button type="submit" className="w-full" disabled={signedout || isSubmitting}>
                    {(() => {
                      if (isSubmitting) return "Creating Room...";
                      if (!signedout) return "Create Bingo";
                      return "Create Bingo — Sign In Required";
                    })()}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex flex-row justify-between items-center">
                <Skeleton className="h-4 w-44 mr-4 md:mr-0 md:w-20" />
                <Skeleton className="h-10 w-full md:w-[25.2rem]" />
              </div>
              <div className="w-full flex flex-row justify-between items-center md:space-x-8">
                <Skeleton className="h-4 w-44 mr-4 md:mr-0 md:w-[6.75rem]" />
                <Skeleton className="h-10 w-full md:w-[25.2rem]" />
              </div>
              <div className="w-full flex flex-row justify-between items-center md:space-x-8">
                <Skeleton className="h-4 w-44 mr-4 md:mr-0 md:w-[4.75rem]" />
                <Skeleton className="h-10 w-full md:w-[25.2rem]" />
              </div>
              <div className="w-full flex flex-row justify-between items-center md:space-x-8">
                <Skeleton className="h-4 w-44 mr-4 md:mr-0 md:w-[2.75rem]" />
                <div className="w-full md:w-auto flex flex-row justify-center items-center gap-2">
                  <Skeleton className="h-[3.6rem] w-full md:w-72" />
                  <Skeleton className="h-[2.4rem] w-10 md:w-[6.738rem]" />
                </div>
              </div>
              <div className="w-full flex flex-row justify-between items-center md:space-x-8">
                <Skeleton className="h-4 w-44 mr-4 md:mr-0 md:w-20" />
                <Skeleton className="h-10 w-full md:w-[25.2rem]" />
              </div>

              <div className="w-full flex flex-row justify-between items-center md:space-x-8">
                <div className="w-44 mr-4 md:mr-0 md:w-auto flex flex-col justify-center items-start gap-0.5 h-12">
                  <Skeleton className="h-4 w-full mr-4 md:mr-0 md:w-[5.3rem]" />
                  <Skeleton className="h-[.9063rem] w-full mr-4 md:mr-0 md:w-[5.656rem]" />
                </div>
                <Skeleton className="h-10 w-full md:w-[25.2rem]" />
              </div>

              <div className="w-full flex flex-row justify-between items-center md:space-x-8">
                <Skeleton className="h-4 w-44 mr-4 md:mr-0 md:w-[4.6rem]" />
                <div className="w-full md:w-auto flex flex-row justify-center items-center gap-3 md:px-2">
                  <Skeleton className="h-10 w-full md:w-[8.611rem]" />
                  <Skeleton className="h-[3.125rem] hidden md:block w-[15.4rem]" />
                </div>
              </div>
              <Skeleton className="w-full h-10" />
            </div>
          )}
        </div>
      </div>
      
      {/* Overwrite Room Dialog */}
      <Dialog open={showOverwriteDialog} onOpenChange={setShowOverwriteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Overwrite Existing Room?</DialogTitle>
            <DialogDescription>
              You already have an active room. Creating a new room will overwrite your existing room.
            </DialogDescription>
          </DialogHeader>
          {existingRoom && (
            <div className="py-4 space-y-2">
              <div className="text-sm font-semibold text-foreground">Current Room Stats:</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Room Name: <span className="text-foreground font-medium">{existingRoom.roomName}</span></div>
                <div>Game Mode: <span className="text-foreground font-medium">{existingRoom.gameMode}</span></div>
                <div>Players: <span className="text-foreground font-medium">{existingRoom.playerCount}</span></div>
                <div>Activities: <span className="text-foreground font-medium">{existingRoom.activityCount}</span></div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowOverwriteDialog(false);
                setPendingRoomData(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            {existingRoom && (
              <Button
                variant="secondary"
                onClick={() => {
                  setShowOverwriteDialog(false);
                  setPendingRoomData(null);
                  router.push(`/bingo/${existingRoom.id}`);
                }}
                className="w-full sm:w-auto"
              >
                Go to Room
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={handleOverwrite}
              disabled={isSubmitting}
              className="bg-destructive text-white w-full sm:w-auto"
            >
              {isSubmitting ? "Overwriting..." : "Overwrite Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

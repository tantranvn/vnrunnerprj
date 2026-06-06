import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { ProvincesService, type RaceCreate, RacesService } from "@/client"
import MediaGalleryManager from "@/components/Media/MediaGalleryManager"
import RaceCategoryManager from "@/components/Races/RaceCategoryManager"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import useCustomToast from "@/hooks/useCustomToast"
import { uploadMediaAsset } from "@/lib/media-api"
import { handleError } from "@/utils"

const formSchema = z.object({
  name: z.string().min(1, { message: "Race name is required" }),
  description: z.string().optional(),
  event_start_date: z.string().min(1, { message: "Start date is required" }),
  event_end_date: z.string().optional(),
  location: z.string().min(1, { message: "Location is required" }),
  country: z.string().optional(),
  province_code: z.string().optional(),
  ward_code: z.string().optional(),
  registration_start: z.string().optional(),
  registration_end: z.string().optional(),
  base_price: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  status: z
    .enum([
      "draft",
      "published",
      "registration_open",
      "registration_closed",
      "completed",
      "cancelled",
    ])
    .optional(),
})

type FormData = z.infer<typeof formSchema>

const AddRace = () => {
  const navigate = useNavigate()
  const [createdRaceId, setCreatedRaceId] = useState<string | null>(null)
  const [createdRaceName, setCreatedRaceName] = useState<string>("")
  const [activeTab, setActiveTab] = useState("details")
  const queryClient = useQueryClient()
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      description: "",
      location: "",
      country: "Vietnam",
      province_code: "",
      ward_code: "",
      currency: "VND",
      status: "draft",
    },
  })

  const selectedProvinceCode = form.watch("province_code")

  // Fetch provinces
  const { data: provincesData } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => ProvincesService.readProvinces({ limit: 100 }),
  })

  // Fetch wards for selected province
  const { data: wardsData } = useQuery({
    queryKey: ["wards", selectedProvinceCode],
    queryFn: async () => {
      if (!selectedProvinceCode) {
        return { data: [], count: 0 }
      }
      return ProvincesService.readWardsByProvince({
        provinceCode: selectedProvinceCode,
        limit: 500,
      })
    },
  })

  const mutation = useMutation({
    mutationFn: (data: RaceCreate) =>
      RacesService.createRace({ requestBody: data }),
    onSuccess: (race) => {
      showSuccessToast("Race created successfully!")
      setCreatedRaceId(race.id)
      setCreatedRaceName(race.name)
      setActiveTab("images")
    },
    onError: handleError.bind(showErrorToast),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["races"] })
    },
  })

  const aiAssistMutation = useMutation({
    mutationFn: async (raceName: string) => {
      return RacesService.generateRaceDetails({
        requestBody: { name: raceName },
      })
    },
    onSuccess: (data) => {
      showSuccessToast("AI has generated race details!")

      // Populate form fields with AI-generated data
      if (data.description) {
        form.setValue("description", data.description)
      }
      if (data.location) {
        form.setValue("location", data.location)
      }
      // Note: terrain_type, difficulty_level, elevation_gain_m are not part of the basic race form
      // They would need to be added to formSchema and the form if needed
    },
    onError: (error) => {
      showErrorToast("Failed to generate race details. Please try again.")
      console.error("AI assist error:", error)
    },
  })

  const aiImageMutation = useMutation({
    mutationFn: async ({ imageType }: { imageType: "cover" | "banner" }) => {
      const raceName = form.getValues("name")
      const location = form.getValues("location")
      return RacesService.generateRaceImageEndpoint({
        requestBody: {
          race_name: raceName,
          location: location || undefined,
          image_type: imageType,
        },
      })
    },
    onSuccess: async (data, variables) => {
      showSuccessToast(`AI has generated ${variables.imageType} image!`)

      if (!createdRaceId) {
        showErrorToast("Race must be created first to upload images.")
        return
      }

      // Type guard to ensure data has the expected shape
      if (typeof data === "object" && data !== null && "image_data" in data) {
        const responseData = data as {
          image_data: string
          mime_type: string
          size: number
        }

        // Convert base64 to File
        const byteString = atob(responseData.image_data)
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }
        const blob = new Blob([ab], { type: "image/png" })
        const file = new File(
          [blob],
          `ai-${variables.imageType}-${Date.now()}.png`,
          { type: "image/png" },
        )

        // Upload the file directly to the race media
        await uploadMediaAsset({
          file,
          contentType: "race",
          contentId: createdRaceId,
          kind: variables.imageType,
          isPrimary: true,
          displayOrder: 0,
        })

        // Invalidate media query to refresh the gallery
        queryClient.invalidateQueries({
          queryKey: ["media", "race", createdRaceId],
        })
      }
    },
    onError: (error, variables) => {
      showErrorToast(
        `Failed to generate ${variables.imageType} image. Please try again.`,
      )
      console.error("AI image generation error:", error)
    },
  })

  const handleAIAssist = () => {
    const raceName = form.getValues("name")
    if (!raceName) {
      showErrorToast("Please enter a race name first.")
      return
    }
    aiAssistMutation.mutate(raceName)
  }

  const handleGenerateImage = (imageType: "cover" | "banner") => {
    const raceName = form.getValues("name")
    if (!raceName) {
      showErrorToast("Please enter a race name first.")
      return
    }
    if (!createdRaceId) {
      showErrorToast("Please create the race first before generating images.")
      return
    }
    aiImageMutation.mutate({ imageType })
  }

  const onSubmit = (data: FormData) => {
    // Transform empty datetime strings to undefined for proper validation
    const cleanedData = {
      ...data,
      event_end_date: data.event_end_date || undefined,
      registration_start: data.registration_start || undefined,
      registration_end: data.registration_end || undefined,
      province_code: data.province_code || undefined,
      ward_code: data.ward_code || undefined,
    }
    mutation.mutate(cleanedData as RaceCreate)
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Add New Race</h2>
        <p className="text-muted-foreground">
          Create a new race event using the organized workflow below.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Race Details</TabsTrigger>
          <TabsTrigger value="images" disabled={!createdRaceId}>
            Images & Media
          </TabsTrigger>
          <TabsTrigger value="categories" disabled={!createdRaceId}>
            Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <div className="flex items-center justify-between">
                        <FormLabel>Race Name *</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAIAssist}
                          disabled={aiAssistMutation.isPending}
                          className="gap-2"
                        >
                          <Sparkles className="h-4 w-4" />
                          {aiAssistMutation.isPending
                            ? "Generating..."
                            : "AI Assist"}
                        </Button>
                      </div>
                      <FormControl>
                        <Input placeholder="City Marathon 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          placeholder="Describe the race event..."
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event_start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Start Date *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="event_end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event End Date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Street, Downtown" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="Vietnam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="province_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province/City (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          form.setValue("ward_code", "") // Reset ward when province changes
                        }}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provincesData?.data?.map((province) => (
                            <SelectItem
                              key={province.code}
                              value={province.code}
                            >
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ward_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>District/Ward (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                        disabled={!selectedProvinceCode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                selectedProvinceCode
                                  ? "Select district/ward"
                                  : "Select province first"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wardsData?.data?.map((ward) => (
                            <SelectItem key={ward.code} value={ward.code}>
                              {ward.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="registration_open">
                            Registration Open
                          </SelectItem>
                          <SelectItem value="registration_closed">
                            Registration Closed
                          </SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registration_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Start</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="registration_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration End</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="base_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={
                            typeof field.value === "number" ? field.value : ""
                          }
                          onChange={(event) => {
                            const value = event.target.value
                            field.onChange(
                              value === "" ? undefined : Number(value),
                            )
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <Input placeholder="USD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/admin/races" })}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={mutation.isPending}
                  disabled={createdRaceId !== null}
                >
                  {createdRaceId ? "Race Created" : "Create Race"}
                </LoadingButton>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          {createdRaceId ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        AI Image Generation
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Generate professional cover and banner images using AI
                        based on the race name and location.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleGenerateImage("cover")}
                        disabled={aiImageMutation.isPending}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {aiImageMutation.isPending
                          ? "Generating..."
                          : "Generate Cover Image"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleGenerateImage("banner")}
                        disabled={aiImageMutation.isPending}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {aiImageMutation.isPending
                          ? "Generating..."
                          : "Generate Banner Image"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <MediaGalleryManager
                contentType="race"
                contentId={createdRaceId}
                title={`Race Media${createdRaceName ? `: ${createdRaceName}` : ""}`}
                description="Upload and manage cover, banner, and gallery images for this race."
              />
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Create the race first to manage images.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          {createdRaceId ? (
            <RaceCategoryManager
              raceId={createdRaceId}
              title={`Race Categories${createdRaceName ? ` for ${createdRaceName}` : ""}`}
              description="Add distance categories (e.g., 5K, 10K, Half Marathon, Marathon) for runners to register."
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Create the race first to add categories.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {createdRaceId ? (
        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Race Created Successfully!</p>
              <p className="text-sm text-muted-foreground">
                Continue to manage images and categories, or create another
                race.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  form.reset()
                  setCreatedRaceId(null)
                  setCreatedRaceName("")
                  setActiveTab("details")
                }}
              >
                Create Another Race
              </Button>
              <Button onClick={() => navigate({ to: "/admin/races" })}>
                View All Races
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AddRace

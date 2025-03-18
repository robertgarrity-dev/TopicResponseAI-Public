import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type BlogTopic } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wand2, Trash2, Loader2, Plus, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaginatedResponse } from "@shared/schema";
import { z } from "zod";

// Define a new schema with all required fields
const createTopicSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  categoryType: z.enum(["existing", "new"], {
    required_error: "Please select whether to use an existing category or create a new one",
  }),
});

type CreateTopicFormValues = z.infer<typeof createTopicSchema>;

export default function Home() {
  const { toast } = useToast();
  const [selectedTopic, setSelectedTopic] = useState<BlogTopic | null>(null);
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categoryType, setCategoryType] = useState<"existing" | "new" | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set());

  // Add pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch all categories
  const { data: allCategories = [] } = useQuery<string[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/categories`);
      return response.json();
    },
  });

  // Update query to include category filter
  const { data: paginatedTopics, isLoading } = useQuery<PaginatedResponse<BlogTopic>>({
    queryKey: ["/api/topics", page, pageSize, selectedCategory],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/topics?page=${page}&pageSize=${pageSize}${selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''}`
      );
      const data = await response.json();
      return data;
    },
  });

  const topics = paginatedTopics?.items || [];
  const totalPages = paginatedTopics?.totalPages || 1;

  const form = useForm<CreateTopicFormValues>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      categoryType: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: CreateTopicFormValues) => {
      const postData = {
        title: values.title,
        description: values.description,
        category: values.category,
        categoryType: values.categoryType // Add categoryType to the request
      };

      const response = await apiRequest("POST", "/api/topics", postData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create topic");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      form.reset();
      setCategoryType(null);
      toast({
        title: "Success",
        description: "Topic created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreateTopicFormValues) => {
    // Validate category selection based on categoryType
    if (data.categoryType === "existing" && !data.category) {
      toast({
        title: "Error",
        description: "Please select an existing category",
        variant: "destructive"
      });
      return;
    }

    if (data.categoryType === "new" && !data.category) {
      toast({
        title: "Error",
        description: "Please enter a new category name",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      toast({ title: "Topic deleted successfully" });
    },
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async (id: number) => {
      setGeneratingFor(id);
      const response = await apiRequest("POST", `/api/topics/${id}/suggestions`);
      const data = await response.json();
      setGeneratingFor(null);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/topics"] });
      // Add topic to expanded suggestions when successful
      setExpandedSuggestions(prev => new Set([...prev, data.id]));
      toast({
        title: "Success",
        description: "AI suggestions generated successfully"
      });
    },
    onError: (error: Error) => {
      setGeneratingFor(null);
      let errorMsg = error.message;
      try {
        const jsonStart = errorMsg.indexOf('{');
        if (jsonStart !== -1) {
          const errorData = JSON.parse(errorMsg.slice(jsonStart));
          errorMsg = errorData.error.split(':')[0];
        }
      } catch (e) {
        // If parsing fails, use the original message
      }

      toast({
        title: "⚠️ AI Service Rate Limited",
        description: "This is a demonstration application with intentional rate limits.\n\nPlease wait 60 seconds before trying again.\n\nError details:\n" + errorMsg,
        variant: "destructive",
        className: "select-text max-w-[500px]",
        duration: 10000
      });
    }
  });

  const handleGenerateSuggestions = (id: number) => {
    generateSuggestionsMutation.mutate(id);
  };

  const processAISuggestions = (suggestions: string) => {
    if (!suggestions) return '';

    // Log the original input for debugging
    console.log('Original AI suggestions:', suggestions);

    // Remove HTML comments and markdown code block syntax
    let processed = suggestions
      .replace(/<!--.*?-->/g, '')  // Remove HTML comments
      .replace(/```(?:html|markdown)?\s*/g, '')  // Remove ```html, ```markdown, or just ```
      .replace(/```\s*$/g, '')     // Remove closing ```
      .trim();

    // Extract all warning/error messages (both div.warning and standard error messages)
    const warnings: string[] = [];

    // Match warning divs
    const warningMatches = processed.match(/<div class="warning">.*?<\/div>/gs);
    if (warningMatches) {
      warningMatches.forEach(match => {
        warnings.push(match);
        processed = processed.replace(match, '');
      });
    }

    // Match GEMINI_TOKEN_LIMIT messages (with different variations)
    const tokenLimitPatterns = [
      /⚠️.*?GEMINI_TOKEN_LIMIT.*?\./gs,
      /Warning:.*?GEMINI_TOKEN_LIMIT.*?\./gs,
      /Note:.*?token.*?limit.*?reached.*?\./gs,
      /Warning:.*?token.*?limit.*?reached.*?\./gs,
      /⚠️.*?token.*?limit.*?reached.*?\./gs
    ];

    tokenLimitPatterns.forEach(pattern => {
      const matches = processed.match(pattern);
      if (matches) {
        matches.forEach(match => {
          warnings.push(`<div class="warning">${match}</div>`);
          processed = processed.replace(match, '');
        });
      }
    });

    // Also remove any remaining markdown block markers
    processed = processed.replace(/^```.*?\n/gm, '').replace(/^```/gm, '').trim();

    // Clean up the processed content
    processed = processed.trim();

    // Add all warnings at the bottom
    if (warnings.length > 0) {
      processed = processed + '\n\n' + warnings.join('\n');
    }

    // Log the processed output for debugging
    console.log('Processed AI suggestions:', processed);

    return processed;
  };

  // Fix the Set iteration issue by converting to array first
  const toggleSuggestion = (topicId: number) => {
    setExpandedSuggestions(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Add title at the top */}
        <h1 className="text-4xl font-bold text-center mb-8 text-black">
          Topic Response AI
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] gap-8">
          {/* Column 1: Sidebar with Create Form and Filter */}
          <div className="space-y-6">
            {/* Create Topic Card */}
            <Card className="h-fit backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                  Create Topic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Title</FormLabel>
                          <FormControl>
                            <Input {...field} className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border-0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border-0" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="categoryType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="font-medium">Category Selection</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value: "existing" | "new") => {
                                field.onChange(value);
                                setCategoryType(value);
                                form.setValue("category", "");
                              }}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="existing" />
                                </FormControl>
                                <FormLabel className="font-normal">Use an existing category</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="new" />
                                </FormControl>
                                <FormLabel className="font-normal">Add a new category</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium">Category</FormLabel>
                          <FormControl>
                            {categoryType === "existing" ? (
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <ScrollArea className="h-[200px]">
                                    {allCategories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </ScrollArea>
                                </SelectContent>
                              </Select>
                            ) : categoryType === "new" ? (
                              <Input {...field} placeholder="Enter new category" className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border-0" />
                            ) : (
                              <Input {...field} disabled placeholder="Select a category type above" className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 border-0" />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="w-full"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create Topic"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Category Filter Card */}
            <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Display Topic Filter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  setPage(1); // Reset to first page when changing category
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Add page size selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Items per page</label>
                  <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select page size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 items</SelectItem>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 2: Topics Display */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {topics.map((topic) => (
                  <Card key={topic.id}
                        className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-0 shadow-xl 
                                  transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-xl font-semibold">{topic.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="flex gap-2 px-4 py-2 bg-[#A7C7E7] hover:bg-[#96b6d6] text-black border border-[#8aa8c9] !opacity-100"
                          onClick={() => handleGenerateSuggestions(topic.id)}
                        >
                          {generatingFor === topic.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-black" />
                          ) : (
                            <>
                              <Wand2 className="h-5 w-5 text-black" />
                              <span className="text-black font-medium">Generate Ideas</span>
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(topic.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                      <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {topic.category}
                      </span>
                      {topic.aiSuggestions && (
                        <div className="mt-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`mb-2 p-2 h-auto rounded-md transition-colors ${
                              expandedSuggestions.has(topic.id)
                                ? "bg-[#96b6d6] text-white"
                                : "bg-[#A7C7E7] text-white"
                            }`}
                            onClick={() => toggleSuggestion(topic.id)}
                          >
                            <div className="flex items-center gap-2 text-primary font-medium">
                              {expandedSuggestions.has(topic.id) ? (
                                <>
                                  <Minus className="h-4 w-4" />
                                  <span>Hide AI Suggestions</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  <span>Show AI Suggestions</span>
                                </>
                              )}
                            </div>
                          </Button>
                          <div className={cn(
                            "overflow-hidden transition-all duration-200",
                            expandedSuggestions.has(topic.id) ? "max-h-[2000px]" : "max-h-0"
                          )}>
                            <div className="p-4 bg-muted/50 rounded-lg border border-border/20">
                              <div
                                className="text-sm prose prose-slate dark:prose-invert prose-sm max-w-none [&_.warning]:text-yellow-600 dark:[&_.warning]:text-yellow-500 [&_.warning]:font-medium [&_.warning]:p-3 [&_.warning]:bg-yellow-50 dark:[&_.warning]:bg-yellow-900/10 [&_.warning]:rounded-md [&_.warning]:border [&_.warning]:border-yellow-200 dark:[&_.warning]:border-yellow-900/20 [&_ul]:list-none [&_ul]:pl-0 [&_li]:block [&_li]:py-1 [&_li]:before:content-['\2022'] [&_li]:before:text-primary [&_li]:before:text-lg [&_li]:before:mr-2 [&_li]:before:inline-block [&_strong]:inline-block [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-primary [&_h3]:mt-4 [&_h3]:first:mt-0"
                                dangerouslySetInnerHTML={{ __html: processAISuggestions(topic.aiSuggestions) }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, paginatedTopics?.total || 0)} of {paginatedTopics?.total || 0} topics
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
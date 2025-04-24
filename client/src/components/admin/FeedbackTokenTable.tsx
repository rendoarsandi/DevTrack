import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Link } from "wouter";
import { Copy, Plus, RefreshCw } from "lucide-react";

interface FeedbackToken {
  id: number;
  projectId: number;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

interface FeedbackTokenTableProps {
  projectId: number;
}

export default function FeedbackTokenTable({ projectId }: FeedbackTokenTableProps) {
  const [copied, setCopied] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: tokens, isLoading, error } = useQuery({
    queryKey: ['/api/admin/projects', projectId, 'feedback-tokens'],
    queryFn: () => apiRequest<FeedbackToken[]>(`/api/admin/projects/${projectId}/feedback-tokens`),
  });

  const createTokenMutation = useMutation({
    mutationFn: () => apiRequest<FeedbackToken>(`/api/admin/projects/${projectId}/feedback-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/projects', projectId, 'feedback-tokens'] });
      toast({
        title: "Success",
        description: "Feedback token created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create token",
        variant: "destructive",
      });
    },
  });

  const handleCreateToken = () => {
    createTokenMutation.mutate();
  };

  const copyToClipboard = (token: string, id: number) => {
    const baseUrl = window.location.origin;
    const feedbackUrl = `${baseUrl}/feedback/${token}`;
    
    navigator.clipboard.writeText(feedbackUrl).then(() => {
      setCopied(id);
      toast({
        title: "Copied!",
        description: "Feedback link copied to clipboard",
      });
      
      setTimeout(() => {
        setCopied(null);
      }, 2000);
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Tokens</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Feedback Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading feedback tokens</p>
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/projects', projectId, 'feedback-tokens'] })}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Feedback Collection Links</CardTitle>
        <Button onClick={handleCreateToken} disabled={createTokenMutation.isPending}>
          {createTokenMutation.isPending ? (
            <LoadingSpinner className="mr-2 h-4 w-4" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Create New Link
        </Button>
      </CardHeader>
      <CardContent>
        {tokens && tokens.length > 0 ? (
          <Table>
            <TableCaption>Share these links with clients to collect feedback</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokens.map((token: FeedbackToken) => (
                <TableRow key={token.id}>
                  <TableCell>{new Date(token.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {token.expiresAt 
                      ? new Date(token.expiresAt).toLocaleDateString() 
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    {token.isUsed ? (
                      <Badge variant="outline" className="bg-gray-100">Used</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(token.token, token.id)}
                      disabled={token.isUsed}
                      className={copied === token.id ? "bg-green-50 text-green-700" : ""}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copied === token.id ? "Copied!" : "Copy Link"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500 mb-4">No feedback links created yet</p>
            <Button onClick={handleCreateToken} disabled={createTokenMutation.isPending}>
              {createTokenMutation.isPending ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create First Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
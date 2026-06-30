"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, MoreHorizontal, Search, Trash2, UserPlus } from "lucide-react";

interface Learner {
  id: string;
  name: string;
  email: string;
  team: string;
  progress: number;
  lastActive: string;
  status: "active" | "inactive" | "completed";
  avatar?: string;
}

interface LearnerTableProps {
  learners: Learner[];
  onLearnerClick?: (learner: Learner) => void;
  onExport?: () => void;
}

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  inactive: { label: "Inactive", variant: "secondary" as const },
  completed: { label: "Completed", variant: "info" as const },
};

export function LearnerTable({ learners, onLearnerClick, onExport }: LearnerTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof Learner>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const itemsPerPage = 10;

  const filteredLearners = learners
    .filter(
      (learner) =>
        learner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        learner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        learner.team.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc" 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return 0;
    });

  const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);
  const paginatedLearners = filteredLearners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: keyof Learner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedLearners.length === paginatedLearners.length) {
      setSelectedLearners([]);
    } else {
      setSelectedLearners(paginatedLearners.map((l) => l.id));
    }
  };

  const toggleSelectLearner = (id: string) => {
    setSelectedLearners((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="Search learners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedLearners.length > 0 && (
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              Delete ({selectedLearners.length})
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1" />
            Add Learner
          </Button>
        </div>
      </div>

      <div className="border border-surface-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-100">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedLearners.length === paginatedLearners.length}
                  onChange={toggleSelectAll}
                  className="rounded border-surface-300"
                />
              </th>
              {[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "team", label: "Team" },
                { key: "progress", label: "Progress" },
                { key: "lastActive", label: "Last Active" },
                { key: "status", label: "Status" },
              ].map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-body-sm font-medium text-surface-400 cursor-pointer hover:text-neutral-50"
                  onClick={() => handleSort(col.key as keyof Learner)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200">
            {paginatedLearners.map((learner) => (
              <tr
                key={learner.id}
                className="hover:bg-surface-50 cursor-pointer"
                onClick={() => onLearnerClick?.(learner)}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedLearners.includes(learner.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectLearner(learner.id);
                    }}
                    className="rounded border-surface-300"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-nexa-500/15 flex items-center justify-center text-nexa-500 font-medium">
                      {learner.name.charAt(0)}
                    </div>
                    <span className="text-body-md font-medium text-neutral-50">
                      {learner.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-body-sm text-surface-text">
                  {learner.email}
                </td>
                <td className="px-4 py-3 text-body-sm text-surface-text">
                  {learner.team}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-nexa-500 rounded-full"
                        style={{ width: `${learner.progress}%` }}
                      />
                    </div>
                    <span className="text-body-sm text-surface-text">
                      {learner.progress}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-body-sm text-surface-text">
                  {learner.lastActive}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusConfig[learner.status].variant}>
                    {statusConfig[learner.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-body-sm text-surface-text">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
          {Math.min(currentPage * itemsPerPage, filteredLearners.length)} of{" "}
          {filteredLearners.length} learners
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-body-sm text-surface-text">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
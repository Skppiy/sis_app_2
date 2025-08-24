// src/components/tables/EntityGrid.tsx
import * as React from "react";
import { DataGrid, GridColDef, GridLoadingOverlayProps } from "@mui/x-data-grid";
import { Box, LinearProgress } from "@mui/material";

function LoadingOverlay(_: GridLoadingOverlayProps) {
  return (
    <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start" }}>
      <Box sx={{ width: "100%" }}><LinearProgress /></Box>
    </Box>
  );
}

type EntityGridProps<T> = {
  rows: T[];
  columns: GridColDef<T>[];
  loading?: boolean;
  getRowId: (row: T) => string;
  onRowDoubleClick?: (row: T) => void;
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
};

export function EntityGrid<T>(props: EntityGridProps<T>) {
  const { rows, columns, loading, getRowId, onRowDoubleClick, checkboxSelection, disableRowSelectionOnClick } = props;

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={!!loading}
      getRowId={getRowId}
      onRowDoubleClick={(p) => onRowDoubleClick?.(p.row)}
      checkboxSelection={checkboxSelection}
      disableRowSelectionOnClick={disableRowSelectionOnClick ?? true}
      slots={{ loadingOverlay: LoadingOverlay }}
      autoHeight
      pageSizeOptions={[10, 25, 50]}
      initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
    />
  );
}

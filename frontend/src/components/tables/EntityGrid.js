import { jsx as _jsx } from "react/jsx-runtime";
import { DataGrid } from "@mui/x-data-grid";
import { Box, LinearProgress } from "@mui/material";
function LoadingOverlay(_) {
    return (_jsx(Box, { sx: { position: "absolute", inset: 0, display: "flex", alignItems: "flex-start" }, children: _jsx(Box, { sx: { width: "100%" }, children: _jsx(LinearProgress, {}) }) }));
}
export function EntityGrid(props) {
    const { rows, columns, loading, getRowId, onRowDoubleClick, checkboxSelection, disableRowSelectionOnClick } = props;
    return (_jsx(DataGrid, { rows: rows, columns: columns, loading: !!loading, getRowId: getRowId, onRowDoubleClick: (p) => onRowDoubleClick?.(p.row), checkboxSelection: checkboxSelection, disableRowSelectionOnClick: disableRowSelectionOnClick ?? true, slots: { loadingOverlay: LoadingOverlay }, autoHeight: true, pageSizeOptions: [10, 25, 50], initialState: { pagination: { paginationModel: { pageSize: 10 } } } }));
}

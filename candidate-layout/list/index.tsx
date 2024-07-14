import "./style.scss";
import { Box, Chip, SelectChangeEvent } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, LegacyRef, MouseEvent, useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams, Outlet, useOutletContext } from "react-router-dom";
import { CandidateService } from "../../../services";
import { ICandidateRow, ICandidateState, IErrorResponse } from "../../../interfaces";
import useTable from "../common/useTable";
import Header from "../../../components/header";
import CustomTable from "../../../components/mui/table";
import Filters from "../components/filters";
import useDebounce from "../../../hooks/useDebounce";
import WarningDialog from "../../../components/mui/warning-dialog";
import useSnackbar from "../../../hooks/useSnackbar";
import useResource from "../../../hooks/useResource";
import useUser from "../../../hooks/useUser";
import { displayName } from "../../../utilities/helper";
interface outletProps {
  setTotalCandidates: (total: number) => void;
  inputRef?: LegacyRef<HTMLInputElement>;
}

const CandidateList = () => {
  let rows: Array<ICandidateRow> = [];
  const { getCandidates, updateCandidateStatusAssignTo, deleteCandidate } = CandidateService();
  const { snackbar } = useSnackbar();
  const { user } = useUser();
  const navigate = useNavigate();
  const { allowPermission } = useResource();
  const { setTotalCandidates, inputRef } = useOutletContext<outletProps>();
  const [searchParams, setSearchParams] = useSearchParams();
  let { typeOfLead } = useParams();
  typeOfLead = typeOfLead ? typeOfLead : "intern";
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const { createColumn, createRow } = useTable({ typeOfLead });
  const [search, setSearch] = useState<string>("");
  const [close, setClose] = useState(false);
  const [state, setState] = useState<ICandidateState>({
    pagination: {
      page: page,
      limit: 20,
      totalPages: 1,
      totalRecords: 0
    },
    filterDialog: {
      anchorEl: null,
      isOpen: false
    },
    filters: {
      search: "",
      campusType: "both",
      status: [],
      source: [],
      assignTo: [],
      jobId: [],
      cpd: []
    },
    filterCount: 0,
    selectAll: [],
    deleteWarning: false,
    multiDeleteWarning: false,
    _id: ""
  });
  const candidates = useQuery({
    queryKey: ["allCandidates", typeOfLead, state.pagination.page, state.filters],
    queryFn: () => getCandidates(
      { page: state.pagination.page, limit: state.pagination.limit, sort: false },
      { typeOfLead: typeOfLead?.toUpperCase(), ...state.filters }
    )
  });

  const searchRecord = useDebounce(search, 1000);
  useEffect(() => {
    if (searchRecord.length) {
      const prevParams: { [index: string]: string } = {};
      searchParams.forEach((value, key) => {
        prevParams[key] = value;
      });

      setSearchParams(prev => ({
        ...prev,
        ...prevParams,
        page: 1,
        search: searchRecord
      }));
    } else {
      searchParams.delete("search");
      searchParams.set("page", "1");
      setSearchParams(searchParams);
    }
  }, [searchRecord]);

  useEffect(() => {
    if(!close && !searchParams.get("assign-to")) {
      const fullName = `${(displayName(user))}`;
      searchParams.set("assign-to", JSON.stringify([{ key: user?._id, value: fullName }]));
      searchParams.set("page", "1");
      setSearchParams(searchParams);
    }
  });

  useEffect(() => {
    if (candidates.data?.data?.length) {
      setState(prevState => ({
        ...prevState,
        pagination: {
          ...prevState.pagination,
          page: candidates.data.meta.page,
          totalPages: candidates.data.meta.totalPages
        }
      }));
      setTotalCandidates(candidates.data.meta.totalRecords);
    } else {
      setTotalCandidates(0);
    }
  }, [candidates.data?.meta]);

  useEffect(() => {
    let filterCount = 0;
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const search = searchParams.get("search") ? String(searchParams.get("search")) : "";
    const status: { key: string, value: string }[] = searchParams.get("status") ? JSON.parse(String(searchParams.get("status"))) : [];
    const source: { key: string, value: string }[] = searchParams.get("source") ? JSON.parse(String(searchParams.get("source"))) : [];
    const cpds: { key: string, value: string }[] = searchParams.get("cpd") ? JSON.parse(String(searchParams.get("cpd"))) : [];
    const jobId: { key: string, value: string }[] = searchParams.get("jobId") ? JSON.parse(String(searchParams.get("jobId"))) : [];
    const assignTo: { key: string, value: string }[] = searchParams.get("assign-to") ? JSON.parse(String(searchParams.get("assign-to"))) : [];
    const date: { key: string, value: string, startDate: string, endDate: string }[] = searchParams.get("date") ? JSON.parse(String(searchParams.get("date"))) : [];
    const experience: { isApply: boolean, value: number[] } = searchParams.get("experience") ? JSON.parse(String(searchParams.get("experience"))) : { isApply: false };
    const ctc: { isApply: boolean, value: number[] } = searchParams.get("ctc") ? JSON.parse(String(searchParams.get("ctc"))) : { isApply: false };
    const ectc: { isApply: boolean, value: number[] } = searchParams.get("ectc") ? JSON.parse(String(searchParams.get("ectc"))) : { isApply: false };
    const noticePeriod: { isApply: boolean, value: number[] } = searchParams.get("notice-period") ? JSON.parse(String(searchParams.get("notice-period"))) : { isApply: false };
    filterCount += status.length ? 1 : 0;
    filterCount += jobId.length ? 1 : 0;
    filterCount += source.length ? 1 : 0;
    filterCount += cpds.length ? 1 : 0;
    filterCount += assignTo?.length ? 1 : 0;
    filterCount += date.length ? 1 : 0;
    filterCount += experience.isApply ? 1 : 0;
    filterCount += ctc.isApply ? 1 : 0;
    filterCount += ectc.isApply ? 1 : 0;
    filterCount += noticePeriod.isApply ? 1 : 0;

    let createdAt: {
      startDate: string;
      endDate: string;
    } | undefined = undefined;
    if (date?.length) {
      createdAt = {
        startDate: date[0]?.startDate,
        endDate: date[0]?.endDate,
      };
    }


    let cpdKeys = cpds.map(cpd => cpd.key);
    const campusType = cpdKeys.filter(key => ["onCampus", "offCampus"].includes(key));
    cpdKeys = cpdKeys.filter(key => !["onCampus", "offCampus"].includes(key));

    setState(prevState => ({
      ...prevState,
      pagination: {
        ...prevState.pagination,
        page
      },
      filters: {
        ...prevState.filters,
        search,
        campusType: (campusType.length === 0 || campusType.length === 2) ? "both" : campusType[0],
        status: status.map(status => status.key),
        source: source.map(source => source.key),
        jobId: jobId.map(jobId => jobId.key),
        cpd: cpdKeys,
        assignTo: assignTo.map(assign => assign.key),
        createdAt,
        experience: experience?.isApply ? { startAmount: experience.value[0], endAmount: experience.value[1] } : undefined,
        ctc: ctc?.isApply ? { startAmount: ctc.value[0], endAmount: ctc.value[1] } : undefined,
        ectc: ectc?.isApply ? { startAmount: ectc.value[0], endAmount: ectc.value[1] } : undefined,
        noticePeriod: noticePeriod?.isApply ? { startAmount: noticePeriod.value[0], endAmount: noticePeriod.value[1] } : undefined,
      },
      filterCount
    }));
  }, [searchParams]);

  const removeFilters = () => {
    setClose(true);
    searchParams.delete("status");
    searchParams.delete("source");
    searchParams.delete("jobId");
    searchParams.delete("cpd");
    searchParams.delete("assign-to");
    searchParams.delete("experience");
    searchParams.delete("ctc");
    searchParams.delete("ectc");
    searchParams.delete("notice-period");
    searchParams.delete("date");
    setSearchParams(searchParams);
  };

  const onPageChange = (e: ChangeEvent<unknown>, page: number) => {
    searchParams.set("page", page.toString());
    setSearchParams(searchParams);
  };

  const onSearch = (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value);

  const handleSelect = (
    e: ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    let payload: Array<string> = [];
    if (e.target.checked) {
      payload = state.selectAll;
      payload.push(id);
    } else {
      payload = state.selectAll.filter((ele) => ele !== id);
    }

    setState(prevState => ({
      ...prevState,
      selectAll: payload
    }));
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    let payload: Array<string> = [];
    if (e.target.checked) {
      if (candidates.data?.data.length) {
        payload = candidates.data?.data
          .filter(candidate => allowPermission(candidate.createdBy?._user))
          .map(candidate => candidate._id);
      }
    } else {
      payload = [];
    }

    setState(prevState => ({
      ...prevState,
      selectAll: payload
    }));
  };

  const handleAssignTo = async (event: SelectChangeEvent<string>, _id: string) => {
    const { name, value } = event.target;

    try {
      const payload = {
        _id,
        [name]: value
      };
      const candidate = await updateCandidateStatusAssignTo(payload);
      snackbar(candidate.message, "info");
      candidates.refetch();
    } catch (error) {
      const err = error as IErrorResponse;
      snackbar(err.data.message, "warning");
      console.log({ "Error in update candidate status": error });
    }
  };

  const handleStatus = async (event: SelectChangeEvent<string>, _id: string) => {
    const { name, value } = event.target;

    try {
      const payload = {
        _id,
        [name]: value
      };
      const candidate = await updateCandidateStatusAssignTo(payload);
      snackbar(candidate.message, "info");
      candidates.refetch();
    } catch (error) {
      const err = error as IErrorResponse;
      snackbar(err.data.message, "warning");
      console.log({ "Error in update candidate status": error });
    }
  };

  const handleDelete = (_id?: string) => setState(prevState => ({
    ...prevState,
    deleteWarning: !prevState.deleteWarning,
    _id: _id ? _id : ""
  }));

  const handleMultiDelete = () => setState(prevState => ({
    ...prevState,
    multiDeleteWarning: !prevState.multiDeleteWarning
  }));

  const onDelete = async () => {
    try {
      const candidate = await deleteCandidate({ _ids: [state._id] });
      setState(prevState => ({
        ...prevState,
        selectAll : prevState.selectAll.filter((id) => id != state._id)
      }));
      snackbar(candidate.message, "info");
      handleDelete();
      candidates.refetch();
    } catch (error) {
      const err = error as IErrorResponse;
      snackbar(err.data.message, "warning");
      handleDelete();
      console.log({ "Error in delete candidate": error });
    }
  };

  const onMultiDelete = async () => {
    try {
      const candidate = await deleteCandidate({ _ids: state.selectAll });
      snackbar(candidate.message, "info");
      candidates.refetch();
      setState(prevState => ({
        ...prevState,
        multiDeleteWarning: false,
        selectAll: []
      }));
    } catch (error) {
      const err = error as IErrorResponse;
      snackbar(err.data.message, "warning");
      handleMultiDelete();
      console.log({ "Error in delete candidate": error });
    }
  };

  const openFilter = (e: MouseEvent<HTMLButtonElement>) => setState(prevState => ({
    ...prevState,
    filterDialog: {
      ...prevState.filterDialog,
      anchorEl: e.currentTarget,
      isOpen: !state.filterDialog.isOpen
    }
  }));

  const closeFilter = () => {
    setState(prevState => ({
      ...prevState,
      filterDialog: {
        ...prevState.filterDialog,
        isOpen: false
      }
    }));
  };

  const isChecked = (candidates.data?.data?.length && state.selectAll?.length === candidates.data?.data?.length) ? true : false;
  const isIndeterminateChecked = (state.selectAll.length > 0 && state.selectAll.length < Number(candidates.data?.data.length)) ? true : false;
  const columns = createColumn(handleSelectAll, isChecked, isIndeterminateChecked);

  if (candidates.data?.data?.length) {
    rows = candidates.data?.data.map((candidate, i) => createRow(i, state.pagination, candidate, state.selectAll, handleAssignTo, handleStatus, handleSelect, handleDelete));
  }

  return (
    <div id="candidate">
      {/* Add Data  */}
      <Header
        className="my-2"
        searchPlaceholder="Search by name, email and phone"
        onSearch={onSearch}
        inputRef={inputRef}
        btnText="Add Candidate"
        onBtnClick={() => navigate("new")}
        onDelete={handleMultiDelete}
        isDeleteDisable={state.selectAll.length ? false : true}
        onFilter={openFilter}
        onImport={() => navigate("import")}
      >
        <Filters
          anchorEl={state.filterDialog.anchorEl}
          isOpen={state.filterDialog.isOpen}
          OnClose={closeFilter}
        />
        {
          state.filterCount > 0 &&
          <Chip
            className="ml-2"
            label={`Filter Applied (${state.filterCount})`}
            color="warning"
            onDelete={removeFilters}
          />
        }
      </Header>

      {/* Show Data  */}
      <Box id="custom-table" marginTop="10px">
        <CustomTable
          columns={columns}
          rows={rows}
          height="calc(100vh - 248px)"
          errorMessage="Add user to see the data here"
          pagination={{
            page: state.pagination.page,
            totalPages: state.pagination.totalPages
          }}
          onPageChange={onPageChange}
        />
      </Box>

      {/* Delete Data  */}
      <WarningDialog
        isOpen={state.deleteWarning}
        onClose={() => handleDelete()}
        onConfirm={onDelete}
        title="Delete Candidate"
        description="Are you sure you want to delete this candidate?"
      />

      {/* Multiple Delete  */}
      <WarningDialog
        isOpen={state.multiDeleteWarning}
        onClose={() => handleMultiDelete()}
        onConfirm={onMultiDelete}
        title="Delete All Candidates"
        description={`Are you sure you want to delete ${state.selectAll.length} selected candidate${state.selectAll.length > 1 ? "s" : ""}?`}
      />

      <Outlet context={{ reFetch: candidates.refetch }} />
    </div>
  );
};

export default CandidateList;
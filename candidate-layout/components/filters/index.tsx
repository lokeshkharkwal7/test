import "../../../../components/shared/filter/style.scss";
import { FC, useEffect, useState } from "react";
import { Box, Button, Checkbox, Chip, Divider, Grid, IconButton, List, ListItemButton, ListItemText, Menu, Slider, Switch, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { ICandidateFilterState, ICpdDrive, IStatus, IUser, IJob } from "../../../../interfaces";
import { capitalize, displayName, checkTimePeriod } from "../../../../utilities/helper";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { yearMarks, LPAMarks, dayMarks, defaultStatus, defaultSource, filterInitialState } from "../../common/helper";
import { MenuItem } from "../../../../components/shared/filter";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";
import dayjs from "dayjs";


interface props {
  anchorEl: null | HTMLElement;
  isOpen: boolean;
  OnClose: () => void;
}

const Filters: FC<props> = ({ anchorEl, isOpen, OnClose }) => {
  const navigate = useNavigate();
  const { typeOfLead } = useParams();
  const [searchParams] = useSearchParams();
  const users = useSelector<{ user: { list: IUser[] } }, IUser[]>(state => state.user.list);
  const drives = useSelector<{ cpdDrive: { list: ICpdDrive[] } }, ICpdDrive[]>(state => state.cpdDrive.list);
  const statusList = useSelector<{ status: { list: IStatus[] } }, IStatus[]>(state => state.status.list);
  const [...jobs] = useSelector<{ job: { list: IJob[] } }, IJob[]>(state => state.job.list) || [];
  const [state, setState] = useState<ICandidateFilterState>({ ...filterInitialState });

  useEffect(() => {
    resetFilter();
  }, [typeOfLead]);

  useEffect(() => {
    const status: { key: string, value: string }[] = searchParams.get("status") ? JSON.parse(String(searchParams.get("status"))) : [];
    const source: { key: string, value: string }[] = searchParams.get("source") ? JSON.parse(String(searchParams.get("source"))) : [];
    const cpd: { key: string, value: string }[] = searchParams.get("cpd") ? JSON.parse(String(searchParams.get("cpd"))) : [];
    const jobId: { key: string, value: string }[] = searchParams.get("jobId") ? JSON.parse(String(searchParams.get("jobId"))) : [];
    const assignTo: { key: string, value: string }[] = searchParams.get("assign-to") ? JSON.parse(String(searchParams.get("assign-to"))) : [];
    const date: { key: string, value: string, startDate: string, endDate: string }[] = searchParams.get("date") ? JSON.parse(String(searchParams.get("date"))) : [];
    const experience: { isApply: boolean, value: number[] } = searchParams.get("experience") ? JSON.parse(String(searchParams.get("experience"))) : { isApply: false, value: [1, 5] };
    const ctc: { isApply: boolean, value: number[] } = searchParams.get("ctc") ? JSON.parse(String(searchParams.get("ctc"))) : { isApply: false, value: [1, 5] };
    const ectc: { isApply: boolean, value: number[] } = searchParams.get("ectc") ? JSON.parse(String(searchParams.get("ectc"))) : { isApply: false, value: [1, 5] };
    const noticePeriod: { isApply: boolean, value: number[] } = searchParams.get("notice-period") ? JSON.parse(String(searchParams.get("notice-period"))) : { isApply: false, value: [15, 30] };

    setState(prevState => ({
      ...prevState,
      status,
      jobId,
      source,
      cpd,
      assignTo,
      experience,
      ctc,
      ectc,
      noticePeriod,
      date
    }));
  }, [searchParams]);


  const handleLeftListItem = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    setState(prevState => ({
      ...prevState,
      selectedMenu: index
    }));
  };


  const handleRightListItem = (name: "status" | "assignTo" | "jobId" | "source" | "cpd", key: string, value: string) => {
    let payload: Array<{
      key: string;
      value: string;
    }> = [];

    const isExist = state[name].find(ele => ele.key === key) ? true : false;
    if (isExist) {
      payload = state[name].filter(ele => ele.key !== key);
    } else {
      payload = state[name];
      payload.push({
        key,
        value
      });
    }

    setState(prevState => ({
      ...prevState,
      [name]: payload
    }));
  };

  const handleDateListItem = (name: "date", key: string, value: string) => {
    const date = checkTimePeriod(key);

    const payload: Array<{
      key: string;
      value: string;
      startDate: string,
      endDate: string,
    }> = [{
      key,
      value,
      startDate: date.startDate,
      endDate: date.endDate,
    }];

    setState(prevState => ({
      ...prevState,
      [name]: payload
    }));
  };

  const handleDate = (e: dayjs.Dayjs | null, period: "start" | "end") => {
    const newDoj = e ? dayjs(e).toISOString() : "";
    let date: Array<{
      key: string;
      value: string;
      startDate: string,
      endDate: string,
    }> = [];

    if (state.date.length && period === "start") {
      date = state.date.map(e => ({ ...e, startDate: newDoj, value: "custom", key: "Custom" }));
    } else if (state.date.length && period === "end") {
      date = state.date.map(e => ({ ...e, endDate: newDoj, value: "custom", key: "Custom" }));
    } else if (!state.date.length && period === "start") {
      date = [{
        key: "custom",
        value: "custom",
        startDate: newDoj,
        endDate: new Date().toISOString()
      }];
    } else {
      date = [{
        key: "custom",
        value: "custom",
        startDate: new Date().toISOString(),
        endDate: newDoj,
      }];
    }

    setState(prevState => ({
      ...prevState,
      date
    }));
  };

  const deleteChip = (name: "status" | "assignTo" | "jobId" | "source" | "cpd" | "date", key: string) => {
    let payload: Array<{
      key: string;
      value: string;
    }> = [];

    payload = state[name].filter(ele => ele.key !== key);
    setState(prevState => ({
      ...prevState,
      [name]: payload
    }));
  };

  const deleteSliderChip = (name: "experience" | "ctc" | "ectc" | "noticePeriod") => {
    setState(prevState => ({
      ...prevState,
      [name]: {
        isApply: false,
        value: name === "noticePeriod" ? [15, 30] : [1, 5]
      }
    }));
  };

  const handleSlider = (name: "experience" | "ctc" | "ectc" | "noticePeriod") => {
    setState(prevState => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        isApply: !prevState[name].isApply
      }
    }));
  };

  const sliderRange = (event: Event, newValue: number | number[], name: "experience" | "ctc" | "ectc" | "noticePeriod") => {
    setState(prevState => ({
      ...prevState,
      [name]: {
        ...prevState[name],
        value: newValue as number[]
      }
    }));
  };

  const resetFilter = () => {
    setState({
      selectedMenu: 0,
      experience: {
        isApply: false,
        value: [1, 5]
      },
      ctc: {
        isApply: false,
        value: [1, 5]
      },
      ectc: {
        isApply: false,
        value: [1, 5]
      },
      noticePeriod: {
        isApply: false,
        value: [15, 30]
      },
      status: [],
      assignTo: [],
      jobId: [],
      source: [],
      cpd: [],
      date: []
    });
  };

  const onClose = () => {
    const status: { key: string, value: string }[] = searchParams.get("status") ? JSON.parse(String(searchParams.get("status"))) : [];
    const source: { key: string, value: string }[] = searchParams.get("source") ? JSON.parse(String(searchParams.get("source"))) : [];
    const cpd: { key: string, value: string }[] = searchParams.get("cpd") ? JSON.parse(String(searchParams.get("cpd"))) : [];
    const jobId: { key: string, value: string }[] = searchParams.get("jobId") ? JSON.parse(String(searchParams.get("jobId"))) : [];
    const assignTo: { key: string, value: string }[] = searchParams.get("assign-to") ? JSON.parse(String(searchParams.get("assign-to"))) : [];
    const date: { key: string, value: string, startDate: string, endDate: string }[] = searchParams.get("date") ? JSON.parse(String(searchParams.get("date"))) : [];
    const experience: { isApply: boolean, value: number[] } = searchParams.get("experience") ? JSON.parse(String(searchParams.get("experience"))) : { isApply: false, value: [1, 5] };
    const ctc: { isApply: boolean, value: number[] } = searchParams.get("ctc") ? JSON.parse(String(searchParams.get("ctc"))) : { isApply: false, value: [1, 5] };
    const ectc: { isApply: boolean, value: number[] } = searchParams.get("ectc") ? JSON.parse(String(searchParams.get("ectc"))) : { isApply: false, value: [1, 5] };
    const noticePeriod: { isApply: boolean, value: number[] } = searchParams.get("notice-period") ? JSON.parse(String(searchParams.get("notice-period"))) : { isApply: false, value: [15, 30] };

    setState(prevState => ({
      ...prevState,
      status,
      jobId,
      source,
      cpd,
      assignTo,
      experience,
      ctc,
      ectc,
      noticePeriod,
      date
    }));
    OnClose();
};

  const onApply = () => {
    searchParams.set("status", JSON.stringify(state.status));
    searchParams.set("assign-to", JSON.stringify(state.assignTo));
    searchParams.set("jobId", JSON.stringify(state.jobId));
    searchParams.set("source", JSON.stringify(state.source));
    searchParams.set("cpd", JSON.stringify(state.cpd));
    searchParams.set("date", JSON.stringify(state.date));

    if (state.experience.isApply) {
      searchParams.set("experience", JSON.stringify(state.experience));
    } else {
      searchParams.delete("experience");
    }

    if (state.ctc.isApply) {
      searchParams.set("ctc", JSON.stringify(state.ctc));
    } else {
      searchParams.delete("ctc");
    }

    if (state.ectc.isApply) {
      searchParams.set("ectc", JSON.stringify(state.ectc));
    } else {
      searchParams.delete("ectc");
    }

    if (state.noticePeriod.isApply) {
      searchParams.set("notice-period", JSON.stringify(state.noticePeriod));
    } else {
      searchParams.delete("notice-period");
    }

    searchParams.set("page", "1");
    navigate({
      pathname: `/candidates/${typeOfLead}`,
      search: searchParams.toString()
    });
    OnClose();
  };

  return <>
    <Menu
      id="basic-menu"
      anchorEl={anchorEl}
      open={isOpen}
      onClose={OnClose}
      MenuListProps={{
        "aria-labelledby": "basic-button",
      }}
    >
      <Box id="filters-container">
        <Box className="center mb-3" justifyContent="space-between" alignItems="start">
          <div className="active-filter mb-1">
            {
              (state.status.length || state.assignTo.length || state.jobId.length || state.source.length || state.cpd.length || state.date.length || state.experience.isApply || state.ctc.isApply || state.ectc.isApply || state.noticePeriod.isApply) ?
                <>
                  {state.status.map(ele => <Chip key={ele.key} className="m-1" color="primary" onDelete={() => deleteChip("status", ele.key)} label={ele.value} variant="outlined" />)}
                  {state.assignTo.map(ele => <Chip key={ele.key} className="m-1" color="primary" onDelete={() => deleteChip("assignTo", ele.key)} label={ele.value} variant="outlined" />)}
                  {state.jobId.map(ele => <Chip key={ele.key} className="m-1" color="primary" onDelete={() => deleteChip("jobId", ele.key)} label={ele.value} variant="outlined" />)}
                  {state.source.map(ele => <Chip key={ele.key} className="m-1" color="primary" onDelete={() => deleteChip("source", ele.key)} label={ele.value} variant="outlined" />)}
                  {state.cpd.map(ele => <Chip key={ele.key} className="m-1" color="primary" onDelete={() => deleteChip("cpd", ele.key)} label={ele.value} variant="outlined" />)}
                  {state.date.map(ele => <Chip key={ele.key} className="m-1" icon={<CalendarMonthIcon />} color="primary" onDelete={() => deleteChip("date", ele.key)} label={ele.value} variant="outlined" />)}
                  {state.experience.isApply && <Chip className="m-1" color="primary" onDelete={() => deleteSliderChip("experience")} label="Experience" />}
                  {state.ctc.isApply && <Chip className="m-1" color="primary" onDelete={() => deleteSliderChip("ctc")} label="CTC" />}
                  {state.ectc.isApply && <Chip className="m-1" color="primary" onDelete={() => deleteSliderChip("ectc")} label="Expected CTC" />}
                  {state.noticePeriod.isApply && <Chip className="m-1" color="primary" onDelete={() => deleteSliderChip("noticePeriod")} label="Notice Period" />}
                </>
                :
                <Box className="mt-2" display="flex" alignItems="center">
                  <FilterAltOffIcon />
                  <Typography className="ml-2">No filters are applied</Typography>
                </Box>
            }
          </div>
          <IconButton
            onClick={onClose}
            style={{ marginRight: "-10px" }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Grid className="filter-box" container>
          <Grid id="left" item xs={5}>
            <List component="nav">

              <MenuItem
                index={0}
                label="Status"
                selectedMenu={state.selectedMenu === 0}
                onChange={handleLeftListItem}
                count={state.status}
              />

              <MenuItem
                index={1}
                label="Assign To"
                selectedMenu={state.selectedMenu === 1}
                onChange={handleLeftListItem}
                count={state.assignTo}
              />

              <MenuItem
                index={2}
                label="Job Title"
                selectedMenu={state.selectedMenu === 2}
                onChange={handleLeftListItem}
                count={state.jobId}
              />

              {
                typeOfLead !== "intern" &&
                <>
                  <MenuItem
                    index={3}
                    label="Experience"
                    selectedMenu={state.selectedMenu === 3}
                    onChange={handleLeftListItem}
                    isApplied={state.experience.isApply}
                    min={state.experience.value[0]}
                    max={state.experience.value[1]}
                  />

                  <MenuItem
                    index={4}
                    label="CTC"
                    selectedMenu={state.selectedMenu === 4}
                    onChange={handleLeftListItem}
                    isApplied={state.ctc.isApply}
                    min={state.ctc.value[0]}
                    max={state.ctc.value[1]}
                  />

                  <MenuItem
                    index={5}
                    label="Expected CTC"
                    selectedMenu={state.selectedMenu === 5}
                    onChange={handleLeftListItem}
                    isApplied={state.ectc.isApply}
                    min={state.ectc.value[0]}
                    max={state.ectc.value[1]}
                  />

                  <MenuItem
                    index={6}
                    label="Notice Period"
                    selectedMenu={state.selectedMenu === 6}
                    onChange={handleLeftListItem}
                    isApplied={state.noticePeriod.isApply}
                    min={state.noticePeriod.value[0]}
                    max={state.noticePeriod.value[1]}
                  />
                </>
              }

              <MenuItem
                index={7}
                label="Source"
                selectedMenu={state.selectedMenu === 7}
                onChange={handleLeftListItem}
                count={state.source}
              />

              {
                typeOfLead === "intern" &&
                <MenuItem
                  index={8}
                  label="CPD"
                  selectedMenu={state.selectedMenu === 8}
                  onChange={handleLeftListItem}
                  count={state.cpd}
                />
              }

              <MenuItem
                index={9}
                label="Date"
                selectedMenu={state.selectedMenu === 9}
                onChange={handleLeftListItem}
                count={state.date}
              />

            </List>
          </Grid>
          <Divider orientation="vertical" />

          <Grid id="right" item xs={6}>
            <List component="nav">
              {
                state.selectedMenu === 0 &&
                defaultStatus.map(status => <ListItemButton
                  key={status.key}
                  selected={state.status.find(ele => ele.key === status.key) ? true : false}
                  onClick={() => handleRightListItem("status", status.key, status.name)}
                >
                  <ListItemText primary={status.name} />
                  <Checkbox edge="end" checked={state.status.find(ele => ele.key === status.key) ? true : false} />
                </ListItemButton>)
              }
              {
                state.selectedMenu === 0 &&
                statusList
                  .filter(status => (status.type === "CANDIDATE" && status.status === "ACTIVE" && status.name !== "APPLIED"))
                  .map((status) =>
                    <ListItemButton
                      key={status._id}
                      selected={state.status.find(ele => ele.key === status.name.toUpperCase()) ? true : false}
                      onClick={() => handleRightListItem("status", status.name.toUpperCase(), capitalize(status.name))}
                    >
                      <ListItemText primary={capitalize(status.name)} />
                      <Checkbox edge="end" checked={state.status.find(ele => ele.key === status.name.toUpperCase()) ? true : false} />
                    </ListItemButton>
                  )
              }
              {
                state.selectedMenu === 1 &&
                users.map((user) =>
                  <ListItemButton
                    key={user._id}
                    selected={state.assignTo.find(ele => ele.key === user._id) ? true : false}
                    onClick={() => handleRightListItem("assignTo", user._id, `${capitalize(displayName(user))}`)}
                  >
                    <ListItemText primary={`${capitalize(displayName(user))}`} />
                    <Checkbox edge="end" checked={state.assignTo.find(ele => ele.key === user._id) ? true : false} />
                  </ListItemButton>
                )
              }
              {
                state.selectedMenu === 2 && 
                jobs.filter(job => job.type === typeOfLead).map(job => <ListItemButton
                  key={job.title}
                  selected={state.jobId.find(ele => ele.key === job.title) ? true : false}
                  onClick={() => handleRightListItem("jobId", job.title, job.title)}
                >
                  <ListItemText primary={job.title} />
                  <Checkbox edge="end" checked={state.jobId.find(ele => ele.key === job.title) ? true : false} />
                </ListItemButton>)
              }
              {
                state.selectedMenu === 3 &&
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography className="fw-bold" variant="body1">Experience Range</Typography>
                    <Switch onClick={() => handleSlider("experience")} checked={state.experience.isApply ? true : false} />
                  </Box>
                  <Typography variant="caption">Shown Experience are in year unit</Typography>
                  <Box marginTop="30px" marginX="25px">
                    <Slider
                      disabled={state.experience.isApply ? false : true}
                      defaultValue={[1, 4]}
                      min={1}
                      max={20}
                      marks={yearMarks}
                      value={state.experience.value}
                      onChange={(e, n) => sliderRange(e, n, "experience")}
                      track="inverted"
                      valueLabelDisplay="auto"
                      aria-labelledby="track-inverted-slider"
                    />
                  </Box>
                </>
              }
              {
                state.selectedMenu === 4 &&
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography className="fw-bold" variant="body1">CTC Range</Typography>
                    <Switch onClick={() => handleSlider("ctc")} checked={state.ctc.isApply ? true : false} />
                  </Box>
                  <Typography variant="caption">Shown CTC are in LPA unit</Typography>
                  <Box marginTop="30px" marginX="25px">
                    <Slider
                      disabled={state.ctc.isApply ? false : true}
                      defaultValue={[1, 4]}
                      min={1}
                      max={20}
                      marks={LPAMarks}
                      value={state.ctc.value}
                      onChange={(e, n) => sliderRange(e, n, "ctc")}
                      track="inverted"
                      valueLabelDisplay="auto"
                      aria-labelledby="track-inverted-slider"
                    />
                  </Box>
                </>
              }
              {
                state.selectedMenu === 5 &&
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography className="fw-bold" variant="body1">Expected CTC Range</Typography>
                    <Switch onClick={() => handleSlider("ectc")} checked={state.ectc.isApply ? true : false} />
                  </Box>
                  <Typography variant="caption">Shown Expected CTC are in LPA unit</Typography>
                  <Box marginTop="30px" marginX="25px">
                    <Slider
                      disabled={state.ectc.isApply ? false : true}
                      defaultValue={[1, 4]}
                      min={1}
                      max={20}
                      marks={LPAMarks}
                      value={state.ectc.value}
                      onChange={(e, n) => sliderRange(e, n, "ectc")}
                      track="inverted"
                      valueLabelDisplay="auto"
                      aria-labelledby="track-inverted-slider"
                    />
                  </Box>
                </>
              }
              {
                state.selectedMenu === 6 &&
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography className="fw-bold" variant="body1">Notice Period Range</Typography>
                    <Switch onClick={() => handleSlider("noticePeriod")} checked={state.noticePeriod.isApply ? true : false} />
                  </Box>
                  <Typography variant="caption">Shown notice period are in days</Typography>
                  <Box marginTop="30px" marginX="25px">
                    <Slider
                      disabled={state.noticePeriod.isApply ? false : true}
                      defaultValue={[15, 30]}
                      marks={dayMarks}
                      value={state.noticePeriod.value}
                      onChange={(e, n) => sliderRange(e, n, "noticePeriod")}
                      track="inverted"
                      valueLabelDisplay="auto"
                      aria-labelledby="track-inverted-slider"
                    />
                  </Box>
                </>
              }
              {
                state.selectedMenu === 7 &&
                defaultSource.map((source) =>
                  <ListItemButton
                    key={source.key}
                    selected={state.source.find(ele => ele.key === source.key) ? true : false}
                    onClick={() => handleRightListItem("source", source.key, capitalize(source.name))}
                  >
                    <ListItemText primary={capitalize(source.name)} />
                    <Checkbox edge="end" checked={state.source.find(ele => ele.key === source.key) ? true : false} />
                  </ListItemButton>
                )
              }
              {
                state.selectedMenu === 8 &&
                <>
                  <ListItemButton
                    key={"onCampus"}
                    selected={state.cpd.find(ele => ele.key === "onCampus") ? true : false}
                    onClick={() => handleRightListItem("cpd", "onCampus", capitalize("On Campus"))}
                  >
                    <ListItemText primary="On Campus" />
                    <Checkbox edge="end" checked={state.cpd.find(ele => ele.key === "onCampus") ? true : false} />
                  </ListItemButton>
                  <ListItemButton
                    key={"offCampus"}
                    selected={state.cpd.find(ele => ele.key === "offCampus") ? true : false}
                    onClick={() => handleRightListItem("cpd", "offCampus", capitalize("Off Campus"))}
                  >
                    <ListItemText primary="Off Campus" />
                    <Checkbox edge="end" checked={state.cpd.find(ele => ele.key === "offCampus") ? true : false} />
                  </ListItemButton>
                  {drives?.map((cpd) =>
                    <ListItemButton
                      key={cpd.cpdId}
                      selected={state.cpd.find(ele => ele.key === cpd.cpdId) ? true : false}
                      onClick={() => handleRightListItem("cpd", cpd.cpdId, capitalize(cpd.cpdId))}
                    >
                      <ListItemText primary={cpd.cpdId} />
                      <Checkbox edge="end" checked={state.cpd.find(ele => ele.key === cpd.cpdId) ? true : false} />
                    </ListItemButton>
                  )}
                </>
              }
              {
                state.selectedMenu === 9 &&
                <>
                  {[
                    { key: "thisWeek", value: "Weekly" },
                    { key: "thisMonth", value: "Monthly" },
                    { key: "thisQuarter", value: "Quarterly" },
                  ]?.map((date) =>
                    <ListItemButton
                      key={date.key}
                      selected={state.date.find(ele => ele.key === date.key) ? true : false}
                      onClick={() => handleDateListItem("date", date.key, capitalize(date.value))}
                    >
                      <ListItemText primary={date.value} />
                      <Checkbox edge="end" checked={state.date.find(ele => ele.key === date.key) ? true : false} />
                    </ListItemButton>
                  )}
                  <Box marginTop={2}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <MobileDatePicker
                        value={state.date[0]?.startDate ? dayjs(state.date[0]?.startDate) : null}
                        onChange={e => handleDate(e, "start")}
                        label="Start Date"
                        format="LL"
                      />
                    </LocalizationProvider>
                    <div className="mt-3" />
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <MobileDatePicker
                        value={state.date[1]?.endDate ? dayjs(state.date[1]?.endDate) : null}
                        onChange={e => handleDate(e, "end")}
                        label="End Date"
                        format="LL"
                      />
                    </LocalizationProvider>
                  </Box>
                </>

              }
            </List>

          </Grid>
        </Grid>

        <Box className="actions-btn" marginTop="8px" textAlign="end">
          <Button variant="outlined" color="error" onClick={() => resetFilter()}>Clear All</Button>
          <Button className="ml-2" onClick={onApply}>Apply</Button>
        </Box>
      </Box>
    </Menu>
  </>;
};

export default Filters;
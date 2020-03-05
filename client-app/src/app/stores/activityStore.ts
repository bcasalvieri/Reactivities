import {
  observable,
  action,
  computed,
  runInAction,
  decorate
} from 'mobx';
import { createContext, SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';

class ActivityStore {
  activityRegistry = new Map();
  activities: IActivity[] = [];
  selectedActivity: IActivity | undefined;
  loadingInitial = false;
  editMode = false;
  submitting = false;
  target = '';

  get activitiesByDate() {
    return Array.from(this.activityRegistry.values()).sort(
      (a, b) => Date.parse(a.date) - Date.parse(b.date)
    );
  }

  loadActivities = async () => {
    this.loadingInitial = true;
    try {
      const activities = await agent.Activities.list();
      runInAction('loading activities', () => {
        activities.forEach(activity => {
          activity.date = activity.date.split('.')[0];
          this.activityRegistry.set(activity.id, activity);
        });
        this.loadingInitial = false;
      });
    } catch (error) {
      runInAction('load activities error', () => {
        this.loadingInitial = false;
      });
      console.log(error);
    }
  };

  createActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.create(activity);
      runInAction('creating activity', () => {
        this.activityRegistry.set(activity.id, activity);
        this.editMode = false;
        this.submitting = false;
      });
    } catch (error) {
      runInAction('create activity error', () => {
        this.submitting = false;
      });
      console.log(error);
    }
  };

  editActivity = async (activity: IActivity) => {
    this.submitting = true;
    try {
      await agent.Activities.update(activity);
      runInAction('editing activity', () => {
        this.activityRegistry.set(activity.id, activity);
        this.selectedActivity = activity;
        this.editMode = false;
        this.submitting = false;
      });
    } catch (error) {
      runInAction('edit activity error', () => {
        this.submitting = false;
      });
      console.log(error);
    }
  };

  deleteActivity = async (
    event: SyntheticEvent<HTMLButtonElement>,
    id: string
  ) => {
    this.submitting = true;
    this.target = event.currentTarget.name;
    try {
      await agent.Activities.delete(id);
      runInAction('deleting activity', () => {
        this.activityRegistry.delete(id);
        this.submitting = false;
        this.target = '';
      });
    } catch (error) {
      runInAction('delete activity error', () => {
        this.submitting = false;
        this.target = '';
      });
      console.log(error);
    }
  };

  openCreateForm = () => {
    this.editMode = true;
    this.selectedActivity = undefined;
  };

  openEditForm = (id: string) => {
    this.selectedActivity = this.activityRegistry.get(id);
    this.editMode = true;
  };

  unselectActivity = () => {
    this.selectedActivity = undefined;
  };

  cancelFormOpen = () => {
    this.editMode = false;
  };

  selectActivity = (id: string) => {
    this.selectedActivity = this.activityRegistry.get(id);
    this.editMode = false;
  };
}

decorate(ActivityStore, {
  activityRegistry: observable,
  activities: observable,
  selectedActivity: observable,
  loadingInitial: observable,
  editMode: observable,
  submitting: observable,
  target: observable,
  activitiesByDate: computed,
  loadActivities: action,
  createActivity: action,
  editActivity: action,
  deleteActivity: action,
  openCreateForm: action,
  unselectActivity: action,
  cancelFormOpen: action,
  selectActivity: action
});

export default createContext(new ActivityStore());

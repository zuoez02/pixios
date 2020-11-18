import store from "@/store";
import { ImageItem } from "@/type";
import { Stats } from "fs";
import dayjs from "dayjs";

const electron = window.require("electron");
const { remote } = electron;
const fs = remote.require("fs");
const path = remote.require("path");

export class FsService {
  public async getProjects(target: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(target, async (v: Error | null, list: string[]) => {
        if (v) {
          reject(v);
          return;
        }
        const folders = list
          .filter(v => !v.startsWith("."))
          .sort((a, b) => a.localeCompare(b));
        const result: string[] = [];
        for (const f of folders) {
          const stat = await this.getStat(path.resolve(target, f));
          if (stat.isDirectory()) {
            result.push(f);
          }
        }
        resolve(result);
      });
    });
  }

  public async getFileList(file: string, days = 0): Promise<ImageItem[]> {
    return new Promise((resolve, reject) => {
      fs.readdir(
        path.resolve(file),
        async (err: Error | null, files: string[]) => {
          if (err) {
            reject(err);
            return;
          }
          const recentFiles: Array<ImageItem> = [];
          const types = ["png", "jpg"];
          for (const v of files) {
            if (types.every(t => !v.endsWith(t))) {
              continue;
            }
            const fp = path.resolve(file, v);
            try {
              const stat = await this.getStat(fp);
              const time = stat.ctime;
              if (
                stat.isFile() &&
                (store.get("mode") !== "recent" ||
                  dayjs(stat.ctime) >
                    dayjs()
                      .startOf("day")
                      .subtract(Math.max(0, days - 1), "day"))
              ) {
                recentFiles.push({
                  path: fp,
                  name: v,
                  cTime: time.getTime(),
                  loading: true,
                  src: null
                });
              }
            } catch (e) {
              reject(e);
              return;
            }
          }
          resolve(recentFiles);
        }
      );
    });
  }

  public async getStat(filePath: string): Promise<Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err: Error | null, stat: Stats) => {
        if (err !== null) {
          reject(err);
          return;
        }
        resolve(stat);
      });
    });
  }

  public resolve(...f: any[]): string {
    return path.resolve(...f);
  }

  public dirname(f: string): string {
    return path.dirname(f);
  }

  public normalize(f: string): string {
    return path.normalize(f);
  }
}

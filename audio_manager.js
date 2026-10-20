/* 台北倖存者 V19.55 — BGM / SFX 獨立控制，任何道具拾獲時播放提示音。 */
(function () {
  'use strict';

  const KEY = 'formosa_survival_audio_v2';
  let settings = { volume: 30, muted: false, sfxVolume: 75, sfxMuted: false };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(+saved.volume)) settings.volume = Math.min(100, Math.max(0, +saved.volume));
      settings.muted = saved.muted === true;
      if (Number.isFinite(+saved.sfxVolume)) settings.sfxVolume = Math.min(100, Math.max(0, +saved.sfxVolume));
      settings.sfxMuted = saved.sfxMuted === true;
    }
  } catch (_) { /* file:// or private mode may block localStorage */ }

  const bgm = new Audio('assets/audio/dark_survival_loop.mp3');
  bgm.loop = true;
  bgm.preload = 'none';
  bgm.volume = settings.volume / 100;

  // V19.55：使用玩家選定的試聽 A 版清脆拾獲叮聲，直接內嵌音檔以避開檔案快取問題。
  const pickupMp3Base64 = 'SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYxLjcuMTAzAAAAAAAAAAAAAAD/+1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABYaW5nAAAADwAAAB8AAB/BACAgIEFBQVxcXHZ2doqKioqXl5ehoaGnp6eurq6utLS0urq6v7+/w8PDx8fHx8vLy87OztLS0tXV1dXY2Njb29vf39/i4uLl5eXl6enp7Ozs7+/v8vLy8vb29vn5+fz8/P///wAAAABMYXZjNjEuMTkAAAAAAAAAAAAAAAAkAuIAAAAAAAAfwag+KGoAAAAAAAAAAAAAAAAAAAAA//vQZAAAAVgAS+UAAAAAAA0goAABJPnhafnNAgAAADSDAAAAGk12qXBSxD6gQGAgGJdwnhgo5KnHMMco4MZAo4vccyBR3/q8MFHVODH+GP7qMnNGREIXVlIWWkSglZCYHigDKhGOSoBcoiJLBzAoCMGBIw41GrFUYJwJhiV0BIKFi7YZO0hWsxfK8OgIo7l48BRNAoMkQhMuazgSOPwZciIRoETBVOVi2UiAKFQFSMWIclhVFAEOCDo0LAAmV1GbMyg/ks33WAAEmWSmPIhYAVAiDlBKoLh2pL+Szn2OeTCVDU92dphvag/EIlTT9+BaX8MKSk5SYch1QZMVkTXVE3xlCXMExW7PSiXTFetY33uHLG+/mk+XhSSLrQOHCUTSYSyZgKglJNRG9As5IcMt426enty/X59/DeefU4i1aQ5dJIpAPAS7IJLXr3Wa0qmhiW18aWhfnCgl0WwtYyml//////////////////+3cnalnPVUDf+l6qIAQnQjAAMSrzNQZCIljBIFGH7MiAAQawKMogYMmFELqcTFKAYqJiZAMFGbAGrDGYwSp7mK5gmGIUMzFSkqcqGh3TA5MEmIYaAScRzgFmTT8CggUhECrUv66LFFmGOAeXCKoEC4IHmm40oJAGZWHzOQMEgQGxGGjAIUAoyMGgMCAFKUCA4xeVTAYFJQQFwwgeiauYkAQjAgUAZMCUehoCl5lVVFDBIGFgAoOgmIgYnWDgCjdEWQp7rDMOYOgOhqTzarU52oQI5LGVAXwVGnrLkvVAZWvKH4+97PoHWI2qtytrGXSd5eLw0LnRRIp2IJZNxxX9YcpS5rAoIdJaTxQTPMzXq6LCICTlU4WGi0FQ07EdWao89CYVuKpVLCI1TKPyrmTJppkJkLDJ5M6cV3Hca+1wuY/gwBWdvCKAGH6JnkScBKp4H5Yczx1XJi0FO03dns6+0tl9JTdzud1rX/////////////9LHeUE3LaTZ7/gyEgKYAgAAAASAAAAQmYmEgaCIYqlQC26VQD5SQAZjQ2pgVpxEwNJgCi/CQshgRn4GJaBWEADAoS+LGUeAmGALCEIzAcMAoBIBCFwQqM4HYgzmNAMNIDMyYYv/74GTmAAuyeFR+d4CQAAANIMAAAC3yGUP57pBHTsOnfz1gkBsNAIcSAEYJK+oCWZdgGAMYSj+/+EfMCQeZo3KTmNwhmIwOAIBUCTVkMAwTlb2sg0AysATCIMy9JZlazBWHMxUtfZ3ZMv52GbO+/sMmBQ+mGImGDgvmBobGBIUgAEHUeJWqkgRvILkEpiOTju9XMGgHLMA4HUyEUQMC4OAps70L+jT3NJjkFrpnmuNMk8afRt5JACfRMB0RSrTpSDgheCqq0XobhpxVdR+gl8mn37d+efx2IYf+R7jc/CFKViNHZFDjC10z8fgSGoFfWC5fEYrn3GWSqmvy6X290MoscyzyqWP7qQNdftxZuNSGPQXMR2U1bdFar1rFS3zHn//////////////Od/+/////////////96tM1t91dBFBnBmdGhGg08lCAAAAAA/wCAuYFoEpgDAXmBgKL/hgBRnTm2mVqRYY9z7v+ZW4s5gKAtHf+BIYwot1QGAUEADhHgYPQWgYddIoHkwMdYiwAhUgKBXA0HKgA2QHgAx4oyatwDgEBaMBgqCoBheBQBicC+BgREwBjLECBgGGu/UBiLEOBh7COF9gMUouwMWIfwMMAYwDikgYnBOgNC2ACEQzeAcBMAIHADwGgYFQAiSizgMKw5QMKImAMFgxwEhYAwJhVAwJAY/hdQIzBtmLeBgTAWBIAY5AGD4GIGAoDAGB4A4GAkAAapAwTgFAwOgI/4KAOAwIAiAwUAMAGBuCAAQGBAAAGC8BoIAIAYHgEA4EwOEMAoAABwIQMCwCwRBLAwFAGBoAoBYCv/wMF4HwMC4FQDgPgYGALAYHATAYKgHAYOQRgYFQDiNwMBIDQMCIDQFASgYEARgYFgMBEDoBIHgzIGAsEYGCIBYx4DwBgHAM//4DQAxXQsjDlwDgGCUBwDjHWKXBuYHyDgIuOeGwAYCgEgHAbACByIRgBAOCgEAIgCAeBUL+AQACDboX9D3wwp////5ExAQMsClAvuTQzAj8vEE///D6CKBkoe0sYYrwf8yLivxiQAIgADkglx1BQJLOmDB7sAEVKCmClJBUQLZAFyOTA05mXMulcZLx0ioypDADRIB5kLnRcJ0UCA0uFxFZLR+ZDHBoaRaFxDJEoOUJ2ELCCwnIxWYos6KSSK0UUVVl10WRMTy6kUW6Skkdr0WqpJLZSTLRZkn1LZbaVLpJJPSWXUfWXjJ6LJJHXaiqp+p0W0UUUTE1WipaVJ1mJrFaOhHHCsfxwMANAADSNKeBFttdCgF9C26raBpyZSJwByHPBtycZiUrf21HXJh16kUw+1iMO5qGiTT9X+d5/713GtAS//662oZh2Bog50sdKepI7S81AU/En6f3Cmf2SSOx352VTP/70ESBAAUWXdH/boACyQz6X+1kAFCEt0H1vQAqny4oPrdABcumZbNZ2O41s8M8rW8bl3uNTvcN3O0uOWufW7vC7eyxw7lrKrZ1yzrK1jjUv6yr4VcKbV21apYzqVf9fLL5Ty1lnjvC1Z1VwtbjU9erxSLTuuWcJVS6o4FrU1SXWaWxarXce2b9XLuV32f5AcAJAAD2xOBYoMEkuVyp7hcbKwrwAAAofEAAFnIT7zFQdk7fuxe05FLH0jwq1I4CPl6CE5CJ0/9v9f/6/95vuXq+XpIuJYsZ3LXatnmNXm92ct6rV6Xm8d/9N3H6uvy7vm8cavQWUFhZNihvHoipvhX4Pwh8KvfCGk0JL/ti54NWa/ncxMAEYAB0iAYwERAxMAI2CMDMBHSY9htjCAIGAgUlj4QMxkFae97kXmHMLp0MDgErwXoBbAqD6EEQUbEDLbqUk1GmsnwGhSZBwvqK0NzQwLxNjhMloPMTVnST1GyJdYxLrKLxsZOitkmRRRRMVtWp7KWpaJkky1Io3MWVUiitFGiykdbVtUk7UWUtJaKLNopJJJOqldaK+tF2rap1ZqoN+QlvGKd5vz2sAAAAWWoAAAAAACUjgMcpHAV25GAADONCwmBGJsNCgmAyCsJCOmBWEiaYYBwcAOaPICgcAGaDoCRgNgDjVBATMWkEiRgYKQFgOI+ApF0DDIOQAYJQGeADYIiPBQOAEmcgYOBrg2zGioRiBhEAUI3OhwgMDoNxlA9gEAAwMD4KgMAYLxYT6agMEAFBJjVmAw3gFAsAwDAWAELNjVRRMlKf8ny4YkTEAxPH1q/icBNB3CCAYIFnknv9L/k0QUUuGFxwEXHGrV///qZNZkTg0CuRQWA3/////LjKNEzhOGizc3Wmgv/////////N2uQAANroAAAAAAB6ifqN+p3wcheDj/wcdRY6xRqxXpjDuxFYloLbAUUKgC4gKTMwcoBCh3G7nBSKqxOzY0RYSuXGPDLNxer2NglKO+BCAABEAABCJ0rT2mlBNNGCIel1DBQbUBRgIL5jACBgIZ4sAJIELKB0GTs8EzNQwjCsDysUh4PhoqTPpMMTMNhIwDWwlUFnEAcYsgRvRdFAFGT/+9BkxIAHaYNK1nrAAEjD2YfNzABr7a1R+d4gAMKIKj8osEgEEB1AkgUHAcwsCQYGTMaJHiM3jGQKBJdTWB4OwcYlDAGEqNSWwBINFGnFpFbX1mFUHZEQGNQkcIChgAPGSBgXUDhkrXffmSQ7FigLwNADvOM/ZjYWmrEGZ3ChmFImEhSZ2BBp8oyOXw7SzTvRtljjwdDj1uStUADgmLJjAiBYgGKSyIwoYaIxjoMNq5U9BU1DcVlVA21d/YZppiNYy3N1gqEwgRtHBIFMQhcWFKXpjcUigfC4Qu15uGNP7Nbhu9qditybpaWglUZobKjBVAYOAQGED7rKU8UAFFNlCWTNH7Y8zW3LoRYlr8wzHa0M09mU3J6w6N6Q8g+dsXYzOw7jV9WNtlLHbkMxjjUpOGgAAAAMAACAPaAAAAAAAHCBjLMIEcVmEh8JCy1DwQ0zziHqrr0MhReORQffORbP0P+zUAAgDClElWERFcpbl9EWhoUYFU1Z+ykLOga5MILwHkuX5d0XMLmHcbohk4cCiikPob4GeAC0AGQgkSRiZJEOBvYTiVTi5w2dSdA2Uy9IP8TySVaNFlLZFVJ5iih/RRfW3MmMWdkUdFqnZJKdNWS362SSUl3RZT0ktFaK0kklosp0belRqc4dNXRRYvHVBYKVaeFfBlxY3v/gVAAEAwqTbmexpKwpbGPBcApFHVMFpbAQojNmALjA1ocpOEDWci5hcw7jdEIQg5JdNUiOEDAbcAAqACkIJEkYmSRDgb2E4lU4jOGzqToGyjy8yDdESNknWarRqWyKqWijrbeii+ia8yYxZ2RR1tVpJTpqyW/WySSkrXRZT0ktFaK1JJIosp0Vt6VGpzh01daMvHVBYKVaeFfBlx5vf/h0AAoBxM0Uq8lIvNKhY4CElYRLwIJgQjWJE6xoZEJo54l+uPs4LJ3W2i6nj//BT9mAIjyRT8JlV3H8U5G4tP6XrjPxXeH1/orjFmtPFzHSjGqnCPBtmW6HqbXJ0Mkm5P8W7Fuj+rkZCzL775h/OFqbdsISnWdvyURdmmnCnbFVe3KY37Sr3OkoAAQAw9kTYosJhUl0UBIElyIHl5aAqKQ486IXUHZGs2sx//uwRPEABMpZ0v9mQAqeKzo/7UwAUOT5R+08dqnckmi9rD3dxyWTxbZUKRB//jzfmqpNiPTt/Ox9BQi03ifsb/NIGJIFJLY8UawvKRM5xTWtYpHf/FBCC1d/QSKJoCGvWZcPfWHp3kb2c79WoA19ABA/lCn+gACFiZBAAAAIOUSEJNlq1HRQBFAZLbIsNBcIKJcIPiPhhMknKSwEBNiD+O2y2WVxwWjwxw7km0iMYjKQsJoFtc3S0QToJofMSelI6aufJkqqN1XrE8mtTVeNDVS/Xik3nS/2cqpL60KJZtSgY2Ot6/S8+kupar3h+awMcGQ0jWdEQUzGEwACAOIySk3tmqZwsiqAFYAmE2adiQwmrEbwAj525Uhe/j+Puy2WZkgiRBvPyfBexjJUEGUJi1Smpfw2gnc1jeDFrWLW1s1xvFyYqm29e2VJSrNS8EfVjN2qzHqqk0YfNTqscZyXM1RmMCFZcMquuGPfbrM2TNgSEF/riWNvdwo8XUNyCr6153yw5hAMexzbl2YrpOCdRFkxXaTAxgV2UyIoCGAdp+koYMAvtOuMqxzacYSRZBuZ7JQRM8y51GiV5p21zn4jowljamZByBqJevzj2tur4WwtQEg6Vd0iJ4MIAAAAY/jIAkOq8crkhhsIiiFIsJh4EV4t8DAECN08CMMAAYCnXGVoe2nGD8aRamfpPIRmjN4kQutLbXMdVSEEIiG1Mzn0ixbbxbWcyXe1ERF+4PorWyyb3iMBgqGlA21+TiWpX+GvYphQQAAgCn0AAB8udwzJAYUAUvoojBPQoUSiQxseEp0oSiwcaeyteCmU3mQRkROHclP/+5BE/QUD/EtNe5MdqIrpme9t47VKpHst7G3p4aSR5f2NvTylrGv4LVOrPc3jRDOgzLsVaCX/1CbjYAGACgcDgAAfNBfJUEN6KD3vop70L9CUBERJy/Fwnf81DIDAACAZfh8u/3ElQTBViJsLglwUyPkqWpBHGEM6qUBxd8lRPnsgHU4df7GoHMMMxY5baQ2ucohugcucXu//ojrJZwCAg+DZKZB6ITg7wI0elL184W+aA7hgkX+VEL//8xaHQZAAIAx+AAAc3W7l0qyGmhZYNqla/4UUCpCqEwuRhdXlAibRpCnbP41mQB1ivO+1RxjBIwFhs3s9ezxrEMEK6j9aKX/x2gEEYACAHYAAAGQds0vtkHcediAhoRfOJGlB3yUAiF6cumGQbQBiwAAgHQwGJ1hOTYFAIaDmlQaMGgCrUtAC1nKrSK7kP4/avYR0gD4rrF8XwBPgjyLcSJ9mrH0Ji60v/9RxwAAQACVD0AfNJvkaIvbwJmbp9SIdeGQbewFYWjfwyDb5HABAeAAAAObljliSgEYVRhgARgoiS1gFdTn/+3Bk1wEyPB7Ne5mDuCBimd0F6kUIZH0z7G4LYHwPZmAntRyMRzOCCwSCMKg1pTBHl6QPz5/vhLgb4fs3s9ez3+2xIs5bvAAYAQDoAAACaInEMCCTEcJ+q7H3nH9ETElUvzh90I4AAEA7ADVtfrZVAPVMVxJ6B0RGVhU6xzCkI/pNDARr7tuQrqLwgSSfH0dAdcF0jaLR9BVZSFRoAKNwAZAfAB6wYTy2zIUpkBWeYLE1R+rA6JfyhepwU6AAMR+AAAAIRWsJwqwkBBw6J4jqAoTviKwDln2XVbT+tDhUMlIXlhIEMDTi0fZ9ZwVFoAEGEAiA7AAAA+rXyMIojg3cJjVQ/Dd8umvkeHOAKiCX2lMUAJfNJh8PHRooW4wXrOvDkz4cUwTTQkxhwgIq2ykiDShppbNHbqGD//tQZPyBEjceS/scatgkApmPAeobB8x7L+huZaB/CmZ8F6kcGgBiAAMCe4ArbyshTEUGqYjU9WAJ/4wfhWZxACMvQAAABValhHAW0DK2hwNiMhFb8BFjEROQDUsUb20TgQoa+cgEIVzyTP5YAKsgATS/gAAAdGpXMb1Cb72HroXL/zQ7Xci4MsOAKafAAhPCcHYBqP9PNMCBZEankBJOpbNbfd6HwpVCmjF5kahLG87WVzwApAABMLVvC2jAfmk3iB+sH3kVgHiEAGVvQAAAAf/7UGTuARHvFkrrXMMIHOKZfQAtFQcoVSnsbmjgcQpmfNMdxJ9ovExS2bm0tAQnVFNkBAE2kzh+BGTSOL0VLnGCUW26ABjACWVUAAArbzpZTAnnkOXT8BgIqzMJl/gAOngKxE0tC5bSciwFIKUiOA2ee5BDcWJwMwd0KzajUM7PP0AAWCAVPA1+DapPZqfgSpCJczB3b4AAAAYnhrg4ACuoqCTl0oEZwzVvCGH/abOONIZupgoD/oAAoKIOvwAABvCtt0TT1UAWAq4Ygu5ITrD/+1Bk64MRpBTL+lqJWhrCGY8ozXEGFFUqhW4jqFwKZnwGlGycQtC5aLWRJODrhANJCz8ZXckw0GmbqTSx1HgGuwAFBADMuNhhTabMtaCblFCqrgAAAAEvGwUo6Y+eRkHg/HoBqzc5z8Lk/xBGtn/FRFNgAUEGABIAAAvBOI/zsBNQ4HESOngxH0Em1WwG1NZLIFnCzHcUE7ZQtvNQ2wAJBl4JxP+eoLuccMzAAAAGflVFO/XcyEhYzDeNbfUiTXNlKAn7AGAASDGABAAAAvBS//tAZPYBMX8Uy3pZacgaQfm/AGsVBZhTL+hqByBKh+Z4ApxsX9uFqwGlFbxDSA9rA2GLAChgZodGRnPF1QZ9gjAAAcAUE78ARkz+xaNr4PuH3gw4gkSqWFLNphQ5ES965YgZpI//eYIAATAACCf0g3RKNB6yE8sOWdgnJDKxgiIuHUZIGm/T8uAAMwAPqelMQU1FMy4xMDBVVVXBwUiuCt5x0PhTT5GUIHbxRzxHKAIAD94tAND/+zBk+gExUhDM+PiA6BNB+a4BohsFREM15uIFYDcH5/gDCIQRASzgl5QuPvIpwo3gQ8Gr0EzVxHLgBwB9b0JMQU1FMy4xMDCqqqqqqqqqqqqgQUqsCt6GC9SiW8DREIrjVomlABwAAH1vIOCMCQDAAJeTBxCJOYuJq67CAAEYAH1yNUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVX/+yBk+wMxPBDM+jhqqBBB+k4ARycErEE1yOGloC4B53gACAxVVUAg5WADPR39V2LTZIgwLiGcg7gBgAAH10oEg0AAGelfKUz0FEKvf7hITEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqiAAoSADPTtblABdhpXYj+hgACQAAz86wUIK//sgZPWDcSsQTflAeAgNAMoOACIhA9Q/M8a9pWAgAyd4AIiEyLj6FN//////////////9dVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVYAAiAAM/M12Amuv6UAPACAGfmbJGiF2//ziv////Rf/9q0xBTUUzLjEwMP/7IGT4AzD9D89w71DoDEDJzgAiIQNUPySGvOjgLAQj0AE9BFVVVVVVVVVVVVVVVVVVVVVVVVVVVYAKADAAB0/+epA/OoUyXk//k7//uLf0WAEAMosBgzs//hhT//yaTEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xBk/gMw5A/KIVhKKAfhCOgASUEDADMmiOEqYBqAJpAAAASqqqqqqqqqqqqBBAB9//UNGh6v/7f/9TAAAgABnQJf/9FMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGT4gzCfCskhrxooBQAJNQAAAQLwKy/FPWhgFQAmIAAABlVVVVVVAQQAM//lALvDV//yX/+pgACQAAz6Ymv//b//oUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZPaDMJkLSCGieDgGwAkoAAABAiQjK8UF4SgZgCTQAAAEQAkAAAZwsCf/85//o//1AICAPv/5gQtAmV//If/6//9STEFNRTMuMTAwqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xBk8gPwlQtHIPgSKAYACSgAAAEBuCMcg4HmIAoAIsAAAASqqqqqqqqqqqrACAAABnBL//rQAYAGc4I3//zn/+z//XVMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTzA/B0CMYg4HkYAYAJAAAAAQGAJSCDgeDgOIBigAAAAFVVQAYAAAZyoTf/9//+R//1AYD7/+QgoaF//7//9v/+hUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZO6B8FYIyCDgeDgBgAjgAAABArgjGSOB4MAAAD/AAAAEVVVVAQAAff/ygKWhP/+///Z//ogAYAGcYB//+///T//rTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk8InwrRfGyaATwAGACNAAAAEB0CMbI4DBAAAAP8AAAARVVVVVVYEEAH3/88Nnhf/9f//Z////9GAFgABnBhP/9SpMQU1FMy4xMDCqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7EGTpg/BxF8WpQBPAAAAP8AAAAQE4ISCDgOEgAAA/wAAABEAGAAAGc0IG//z//+S//1f/65ABnCg7//zv/+j//X//rkxBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sQZOuB8HYXxSjgE8AAAA/wAAABAaAjIIOBYQAAAD/AAAAEqqqqqqqqqqqqqqqBAAA5Lp/1cTAkYoZ//+d///////01TEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk7gHweQjGQOAoQAAAD/AAAAECMF8UxQBPAAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTpg/BKCEhA4BBAAAAP8AAAAQHEIxkDgUEAAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZO0D8HkIxkDgOEAAAA/wAAABAexdFKUATwAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk7IPwhBdFKUATwAAAD/AAAAEBsCMbA4ChAAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTrgfCRF0WpQBPAAAAP8AAAAQEgISEDgEEAAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZO4L8JAIxkDgUEAAAA/wAAABAdgjGQOAoQAAAD/AAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk6I/wqxdEqOATwAAAD/AAAAEAAAH+AAAAIAAAP8AAAARVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==';
  const pickupSrc = 'data:audio/mpeg;base64,' + pickupMp3Base64;
  const sfxConfig = {
    search: { src: 'assets/audio/sfx_search_loot.mp3', gain: 0.55 },
    hit:    { src: 'assets/audio/sfx_hit_enemy.mp3',   gain: 0.72 },
    hurt:   { src: 'assets/audio/sfx_player_hurt.mp3', gain: 0.78 },
    material: { src: pickupSrc, gain: 0.95 }
  };
  const sfxSources = Object.create(null);
  const sfxBuffers = Object.create(null);
  const activeSfx = new Set();
  let sfxPrimed = false;
  let sfxDecodeStarted = false;
  let deferredPickupAt = 0;
  for (const [name, cfg] of Object.entries(sfxConfig)) {
    const audio = new Audio(cfg.src);
    audio.preload = 'auto';
    sfxSources[name] = audio;
  }

  let started = false;
  let suspendedByVisibility = false;
  let alertContext = null;
  let warningActive = false;
  let lastWarningAt = -Infinity;

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) {}
  }

  function calcVolume(multiplier = 1) {
    return Math.max(0, Math.min(1, (settings.sfxVolume / 100) * multiplier));
  }

  function stopSfx(name) {
    for (const entry of [...activeSfx]) {
      if (!name || entry.name === name) entry.stop();
    }
  }

  function stopAllSfx() { stopSfx(); }

  function decodeSfxBuffers() {
    // Web Audio 在首次點擊啟用後可由定時器觸發，避免 iPhone Safari 封鎖非手勢觸發的 Audio.play()。
    if (sfxDecodeStarted || !alertContext || typeof alertContext.decodeAudioData !== 'function' || typeof fetch !== 'function') return;
    sfxDecodeStarted = true;
    for (const [name, cfg] of Object.entries(sfxConfig)) {
      // 叮聲以內嵌 bytes 解碼，不依賴額外網路請求；其餘寫實音效沿用檔案載入。
      const bytesPromise = name === 'material'
        ? Promise.resolve(Uint8Array.from(atob(pickupMp3Base64), c => c.charCodeAt(0)).buffer)
        : fetch(cfg.src).then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.arrayBuffer();
          });
      bytesPromise
        .then(buffer => alertContext.decodeAudioData(buffer))
        .then(decoded => {
          sfxBuffers[name] = decoded;
          if (name === 'material' && deferredPickupAt && performance.now() - deferredPickupAt <= 800) {
            deferredPickupAt = 0;
            playSfx('material');
          }
        })
        .catch(err => { console.debug(`寫實音效 ${name} 緩衝失敗，改用音訊檔備援`, err); });
    }
  }

  function primeSfx() {
    if (!sfxPrimed) {
      sfxPrimed = true;
      Object.values(sfxSources).forEach(audio => {
        try { audio.load(); } catch (_) {}
      });
    }
    decodeSfxBuffers();
  }

  function playSfx(name) {
    const source = sfxSources[name];
    const cfg = sfxConfig[name];
    if (!source || !cfg || settings.sfxMuted || settings.sfxVolume <= 0 || document.hidden) return false;

    // 優先使用首次點擊解鎖的 AudioContext：NPC 在背景計時器攻擊玩家時也能播放。
    const context = alertContext;
    if (context && context.state === 'running' && sfxBuffers[name] &&
        typeof context.createBufferSource === 'function') {
      try {
        const node = context.createBufferSource();
        const gain = context.createGain();
        node.buffer = sfxBuffers[name];
        gain.gain.value = calcVolume(cfg.gain);
        node.connect(gain);
        gain.connect(context.destination);
        const entry = {
          name,
          stop() {
            try { node.stop(); } catch (_) {}
            try { node.disconnect(); gain.disconnect(); } catch (_) {}
            activeSfx.delete(entry);
          }
        };
        node.onended = () => {
          try { node.disconnect(); gain.disconnect(); } catch (_) {}
          activeSfx.delete(entry);
        };
        activeSfx.add(entry);
        node.start();
        return true;
      } catch (err) {
        console.debug(`音效 ${name} Web Audio 播放失敗`, err);
      }
    }

    // 音訊快取尚未解碼或 file:// 環境：保留原本 HTMLAudio 播放路徑。
    try {
      const clip = source.cloneNode(true);
      clip.preload = 'auto';
      clip.volume = calcVolume(cfg.gain);
      const entry = {
        name,
        stop() {
          try { clip.pause(); clip.currentTime = 0; } catch (_) {}
          activeSfx.delete(entry);
        }
      };
      activeSfx.add(entry);
      const cleanup = () => activeSfx.delete(entry);
      clip.addEventListener('ended', cleanup, { once: true });
      clip.addEventListener('error', cleanup, { once: true });
      const promise = clip.play();
      if (promise && typeof promise.catch === 'function') promise.catch(() => {
        cleanup();
        // Safari 可能拒絕讀條結束後（非直接點擊）的 HTMLAudio.play()。
        // 若 Web Audio 尚未解碼完成，短時間內完成時再補播一次。
        if (name === 'material' && !sfxBuffers.material) deferredPickupAt = performance.now();
      });
      return true;
    } catch (err) {
      console.debug(`音效 ${name} 播放失敗`, err);
      return false;
    }
  }

  function unlockAlertAudio() {
    // 音效獨立於 BGM 靜音；解鎖動作一定要在點擊／觸控事件內進行。
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      if (!alertContext) alertContext = new Ctor();
      decodeSfxBuffers();
      if (alertContext.state === 'suspended') {
        const promise = alertContext.resume();
        if (promise?.catch) promise.catch(() => {});
      }
    } catch (err) { console.debug('警報音目前無法啟動', err); }
  }

  function beepZoneWarning() {
    if (!alertContext || alertContext.state !== 'running' || settings.muted || settings.volume <= 0 || document.hidden) return;
    try {
      const t = alertContext.currentTime;
      for (const [offset, freq] of [[0, 660], [0.19, 470]]) {
        const oscillator = alertContext.createOscillator();
        const gain = alertContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, t + offset);
        const peak = 0.17 * (settings.volume / 100);
        gain.gain.setValueAtTime(0.0001, t + offset);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + offset + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.16);
        oscillator.connect(gain);
        gain.connect(alertContext.destination);
        oscillator.start(t + offset);
        oscillator.stop(t + offset + 0.165);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      }
    } catch (err) { console.debug('禁區警報音播放失敗', err); }
  }

  function refresh() {
    const volume = document.getElementById('audio-volume');
    const label = document.getElementById('audio-volume-label');
    const mute = document.getElementById('audio-mute-button');
    if (volume) volume.value = String(settings.volume);
    if (label) label.textContent = settings.volume + '%';

    const menuVolume = document.getElementById('audio-volume-menu');
    const menuLabel = document.getElementById('audio-volume-label-menu');
    if (menuVolume) menuVolume.value = String(settings.volume);
    if (menuLabel) menuLabel.textContent = settings.volume + '%';

    if (mute) {
      mute.textContent = settings.muted ? '🔇 已靜音' : '🔊 音樂開啟';
      mute.setAttribute('aria-pressed', String(settings.muted));
    }
    const menuMute = document.getElementById('audio-mute-button-menu');
    if (menuMute) {
      menuMute.textContent = settings.muted ? '🔇 已靜音' : '🔊 音樂開啟';
      menuMute.setAttribute('aria-pressed', String(settings.muted));
    }
    for (const suffix of ['', '-menu']) {
      const sfxVolume = document.getElementById('audio-sfx-volume' + suffix);
      const sfxLabel = document.getElementById('audio-sfx-volume-label' + suffix);
      const sfxMute = document.getElementById('audio-sfx-mute' + suffix);
      if (sfxVolume) sfxVolume.value = String(settings.sfxVolume);
      if (sfxLabel) sfxLabel.textContent = settings.sfxVolume + '%';
      if (sfxMute) {
        sfxMute.textContent = settings.sfxMuted ? '🔇 音效關閉' : '🔊 音效開啟';
        sfxMute.setAttribute('aria-pressed', String(settings.sfxMuted));
      }
    }
    const lobbyBtn = document.getElementById('audio-button-lobby');
    if (lobbyBtn) {
      lobbyBtn.textContent = settings.muted || settings.volume === 0 ? '🔇' : '🎵';
      lobbyBtn.title = settings.muted ? '音樂已靜音（點擊調整）' : '音樂設定';
    }
  }

  const GameAudio = {
    refresh,
    primeSfx,
    playSfx,
    playMaterialFound() { return playSfx('material'); },
    // 音效試播是在玩家直接點擊時執行，兼作 iOS 首次解鎖及診斷。
    previewPickup() {
      unlockAlertAudio();
      primeSfx();
      playSfx('material');
    },
    setSfxVolume(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      settings.sfxVolume = Math.min(100, Math.max(0, Math.round(parsed)));
      if (settings.sfxVolume === 0) stopAllSfx();
      persist(); refresh();
    },
    toggleSfxMute() {
      settings.sfxMuted = !settings.sfxMuted;
      if (settings.sfxMuted) stopAllSfx();
      persist(); refresh();
    },
    stopSfx,
    syncZoneWarning(isPending, remainSeconds = 120) {
      const active = !!isPending;
      if (!active) {
        warningActive = false;
        lastWarningAt = -Infinity;
        return;
      }
      const now = performance.now();
      const intervalMs = remainSeconds <= 30 ? 5000 : 12000;
      if (!warningActive || now - lastWarningAt >= intervalMs) {
        warningActive = true;
        if (started && !settings.muted && settings.volume > 0 && !document.hidden) {
          beepZoneWarning();
          lastWarningAt = now;
        }
      }
    },
    play() {
      started = true;
      unlockAlertAudio();
      primeSfx();
      if (settings.muted || settings.volume === 0 || document.hidden) return;
      bgm.volume = settings.volume / 100;
      const promise = bgm.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(err => { console.info('音樂等待使用者操作才能播放:', err && err.message); });
      }
    },
    setVolume(value) {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) return;
      settings.volume = Math.max(0, Math.min(100, Math.round(parsed)));
      bgm.volume = settings.volume / 100;
      persist();
      refresh();
      if (settings.volume === 0) {
        bgm.pause();
      } else if (started && !settings.muted && !document.hidden) {
        this.play();
      }
    },
    toggleMute() {
      settings.muted = !settings.muted;
      persist();
      refresh();
      if (settings.muted) {
        bgm.pause();
      } else {
        lastWarningAt = -Infinity;
        this.play();
      }
    },
    togglePanel() {
      document.getElementById('audio-settings-panel')?.classList.toggle('hidden');
      refresh();
    },
    closePanel() {
      document.getElementById('audio-settings-panel')?.classList.add('hidden');
    },
    getState() {
      return { ...settings, started, paused: bgm.paused, src: bgm.currentSrc, sfxPrimed };
    }
  };

  window.GameAudio = GameAudio;

  // 只解鎖，不主動播放聲音。背景音樂維持原本點首頁才啟動。
  document.addEventListener('pointerdown', function (event) {
    if (!event.isTrusted) return;
    unlockAlertAudio();
    primeSfx();
  }, { capture: true, passive: true });

  document.addEventListener('click', function (event) {
    const lobby = document.getElementById('lobby-screen');
    if (!lobby || lobby.classList.contains('hidden')) return;
    if (!event.isTrusted) return;
    primeSfx();
    if (!settings.muted && settings.volume > 0 && !document.hidden && bgm.paused) {
      GameAudio.play();
    }
  }, true);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      suspendedByVisibility = started && !bgm.paused;
      bgm.pause();
      stopAllSfx();
    } else if (suspendedByVisibility && started && !settings.muted) {
      suspendedByVisibility = false;
      GameAudio.play();
    }
  });

  window.addEventListener('pagehide', () => {
    bgm.pause();
    stopAllSfx();
  });

  refresh();
})();

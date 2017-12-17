let i = 0
var charts = {}
for (table of $(".nodeinfo")) {
  i++
  $table = $(table)
  let iota = new IOTA({
    provider: table.dataset.ip
  })

  iota.api.getNodeInfo(function(err, res) {

    var cont = "<p class='nodeinfo'>"
    console.log(res)
    cont += "<b>Sync: </b><span class='sync" + i + "'>" + res.latestSolidSubtangleMilestoneIndex + " / " + res.latestMilestoneIndex + "</span></br>"
    cont += "<b>Tips: </b><span class='tips" + i + "''>" + res.tips + "</span></br>"
    cont += "<b>CPU Cores: </b><span class='cpu'>" + res.jreAvailableProcessors + "</span></br>"
    cont += "<b>RAM Utilization: </b><span class='ram" + i + "'>" + humanFileSize(res.jreTotalMemory, true) + " / " + humanFileSize(res.jreMaxMemory, true) + "</span></br>"
    cont += '<canvas id="nodeinfo' + i + '" width="400" height="300"></canvas>'
    cont += "</p>"

    $table.html(cont)
    var ctx = $("#nodeinfo" + i)
    updatedata = function(first) {
      first = !!first

      iota.api.getNodeInfo(function(err, res) {
        $(".sync" + i).html(res.latestSolidSubtangleMilestoneIndex + " / " + res.latestMilestoneIndex)
        $(".tips" + i).html(res.tips)
        $(".ram" + i).html(humanFileSize(res.jreTotalMemory, true) + " / " + humanFileSize(res.jreMaxMemory, true))
      })


      $.getJSON(table.dataset.ip.substring(0, table.dataset.ip.lastIndexOf(":")) + ":14222").done(function(data) {
        console.log(data)

        if (first) {
          var chart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: Array.apply(null, Array(data.length)).map(function (_, i) {return i;}),
              datasets: [{
                label: "CPU Utilization",
                data: data
              }]
            },
            options: {
              scales: {
                xAxes: [{
                  display: false
                }]
              }
            }
          })

          charts[table.dataset.ip] = chart
        } else {
          charts[table.dataset.ip].data.labels.push(charts[table.dataset.ip].data
            .labels[charts[table.dataset.ip].data.labels.length - 1] + 1)

          charts[table.dataset.ip].data.datasets[0]['data'].push(data[data.length - 1])
          charts[table.dataset.ip].update()
          charts[table.dataset.ip].data.labels.shift()
          charts[table.dataset.ip].data.datasets[0]['data'].shift()
          charts[table.dataset.ip].update()

        }

      })
    }
    updatedata(true)
    setInterval(updatedata, 5000)
  })

  console.log(table.dataset.ip.substring(0, table.dataset.ip.lastIndexOf(":")) + ":14222")

}

function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
        : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(2)+' '+units[u];
}
